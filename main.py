from fastapi import FastAPI
import httpx

app = FastAPI()

async def get_ban(steamid, API_KEY):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/",
            params={
                "key": API_KEY,
                "steamids": steamid,
            },
        )
    data = response.json()

    player = data["players"][0]
    return {
        "community_banned": player["CommunityBanned"],
        "vac_banned": player["VACBanned"],
        "eco_banned": player["EconomyBan"],
    }

async def get_time_info(steamid, API_KEY):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
            params={
                "key": API_KEY,
                "steamids": steamid,
            },
        )
    data = response.json()
    player = data["response"]["players"][0]
    return {
        "communityvisibilitystate": player["communityvisibilitystate"],
        "profilestate": player.get("profilestate", None),
        "timecreated": player.get("timecreated", None),
        "lastlogoff": player.get("lastlogoff", None),
        }

import httpx

async def get_cs_playtime(steamid: str, api_key: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
            params={
                "key": api_key,
                "steamid": steamid,
                "include_appinfo": 1,
                "include_played_free_games": 1
            },
        )

    data = response.json()
    games = data.get("response", {}).get("games", [])

    cs = next((g for g in games if g["appid"] == 730), None)

    if not cs:
        return {
            "cs_hours": 0,
            "found": False
        }

    return {
        "cs_hours": cs["playtime_forever"] / 60,
        "found": True
    }
