from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from datetime import datetime, UTC
import os

API_KEY = os.environ.get('API_KEY')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


async def get_ban(steamid):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/",
            params={
                "key": API_KEY,
                "steamids": steamid,
            },
        )

    data = response.json()
    players = data.get("players", [])

    if not players:
        return None

    player = players[0]

    return {
        "community_banned": player["CommunityBanned"],
        "vac_banned": player["VACBanned"],
        "eco_banned": player["EconomyBan"],
        "game_bans": player["NumberOfGameBans"],
    }


async def get_time_info(steamid):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
            params={
                "key": API_KEY,
                "steamids": steamid,
            },
        )

    data = response.json()
    players = data.get("response", {}).get("players", [])

    if not players:
        return None

    player = players[0]

    return {
        "communityvisibilitystate": player["communityvisibilitystate"],
        "profilestate": player.get("profilestate"),
        "timecreated": player.get("timecreated"),
        "lastlogoff": player.get("lastlogoff"),
    }


async def get_cs_playtime(steamid):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
            params={
                "key": API_KEY,
                "steamid": steamid,
                "include_appinfo": 1,
                "include_played_free_games": 1,
            },
        )

    data = response.json()
    games = data.get("response", {}).get("games", [])

    cs = next((g for g in games if g["appid"] == 730), None)

    if cs is None:
        return {
            "found": False,
            "cs_hours": 0,
        }

    return {
        "found": True,
        "cs_hours": cs["playtime_forever"] / 60,
    }


async def calculate_score(steamid):
    bans = await get_ban(steamid)

    if bans is None:
        return {
            "score": 0,
            "confidence": 0,
            "reason": "Player Not Found",
        }

    info = await get_time_info(steamid)

    if info is None:
        return {
            "score": 0,
            "confidence": 0,
            "reason": "Player Not Found",
        }

    cs_playtime = await get_cs_playtime(steamid)

    # 封禁直接 0 分
    if (
        bans["community_banned"]
        or bans["vac_banned"]
        or bans["eco_banned"] != "none"
        or bans["game_bans"] > 0
    ):
        return {
            "score": 0,
            "confidence": 100,
            "reason": "Banned",
        }

    # 资料不可见
    if (
        info["communityvisibilitystate"] != 3
        or info["profilestate"] is None
        or info["timecreated"] is None
        or info["lastlogoff"] is None
    ):
        return {
            "score": 0,
            "confidence": 0,
            "reason": "Visibility Issues",
        }

    # 游戏数据不可见
    if not cs_playtime["found"]:
        return {
            "score": 0,
            "confidence": 0,
            "reason": "Game Data Not Public",
        }

    score = 100

    now = datetime.now(UTC).timestamp()

    # 账户年限
    account_age_hours = (now - info["timecreated"]) / 3600

    if account_age_hours < 8766:
        score -= 30
    elif account_age_hours < 26298:
        score -= 10
    elif account_age_hours >= 52596:
        score += 10

    # CS 时长
    cs_hours = cs_playtime["cs_hours"]

    if cs_hours < 50:
        score -= 60
    elif cs_hours < 300:
        score -= 20
    elif cs_hours >= 1000:
        score += 10

    # 最近使用
    inactive_hours = (now - info["lastlogoff"]) / 3600

    if inactive_hours > 8765:
        score -= 50
    elif inactive_hours > 730:
        score -= 30

    score = max(0, min(score, 100))

    return {
        "score": score,
        "confidence": 100,
        "reason": None,
    }


@app.get("/score")
async def main(steamid: str):
    return await calculate_score(steamid)

@app.get("/")
async def root():
    return {
        "name": "Steam Trust Score API",
        "version": "1.0",
    }
