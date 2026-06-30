import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Github,
  Globe,
  Info,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CS 信誉评分查询 · Nalanyinyun Gakuen" },
      {
        name: "description",
        content: "输入 SteamID，即可查询该玩家在 CS 游戏中的信誉评分、置信度与判定理由。",
      },
      { property: "og:title", content: "CS 信誉评分查询" },
      {
        property: "og:description",
        content: "输入 SteamID，即可查询该玩家在 CS 游戏中的信誉评分、置信度与判定理由。",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

type ScoreResponse = {
  score: number;
  confidence: number;
  reason: string;
};

type ScoreTone = {
  label: string;
  chipClass: string;
  barClass: string;
  ringClass: string;
  Icon: typeof ShieldCheck;
};

function getTone(score: number): ScoreTone {
  if (score >= 75) {
    return {
      label: "信誉良好",
      chipClass: "bg-success-container text-on-success-container",
      barClass: "bg-success",
      ringClass: "ring-success/30",
      Icon: ShieldCheck,
    };
  }
  if (score >= 40) {
    return {
      label: "需要关注",
      chipClass: "bg-warning-container text-on-warning-container",
      barClass: "bg-warning",
      ringClass: "ring-warning/30",
      Icon: ShieldAlert,
    };
  }
  return {
    label: "信誉较差",
    chipClass: "bg-error-container text-on-error-container",
    barClass: "bg-destructive",
    ringClass: "ring-destructive/30",
    Icon: ShieldX,
  };
}

function Index() {
  const [steamId, setSteamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScoreResponse | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = steamId.trim();
    if (!id) {
      setError("请输入 SteamID");
      return;
    }
    if (!/^\d{6,20}$/.test(id)) {
      setError("SteamID 应为 6–20 位数字");
      return;
    }
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(
        `https://cs.naranyinyun.work/score?steamid=${encodeURIComponent(id)}`,
      );
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);
      const json = (await res.json()) as ScoreResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  const tone = data ? getTone(data.score) : null;
  const scoreClamped = data ? Math.max(0, Math.min(100, data.score)) : 0;
  const confidencePct = data
    ? Math.round(Math.max(0, Math.min(100, data.confidence <= 1 ? data.confidence * 100 : data.confidence)))
    : 0;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Ambient warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-220px] h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-primary-container/70 blur-3xl" />
        <div className="absolute left-[12%] top-[120px] h-[260px] w-[260px] rounded-full bg-primary/15 blur-3xl" />
      </div>

      {/* Top app bar */}
      <header className="sticky top-0 z-20 border-b border-outline-variant/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 md:px-8">
          <a href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elev1">
              <ShieldCheck className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight">CS 信誉评分</span>
              <span className="text-[11px] text-muted-foreground">Credibility Lookup</span>
            </span>
          </a>

          <nav className="flex items-center gap-1">
            <a
              href="https://nalanyinyun.work"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">nalanyinyun.work</span>
            </a>
            <a
              href="https://github.com/naranyinyun/csTrustFactor"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub repository"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-10 md:px-8 md:pt-16">
        {/* Hero */}
        <section className="mb-10 md:mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
            <Sparkles className="h-3.5 w-3.5" />
            非官方 · 独立评估
          </span>
          <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[44px]">
            查询玩家的 <span className="text-primary">CS 信誉评分</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
            输入 Steam 64 位 ID，系统将基于公开数据返回该账号的信誉评分、判定置信度，以及简要分析理由。
          </p>
        </section>

        {/* Query card */}
        <section className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-5 shadow-elev1 md:p-7">
          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="steamid"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                SteamID
              </label>
              <Input
                id="steamid"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="例如 76561198000000000"
                inputMode="numeric"
                autoComplete="off"
                className="h-14 rounded-2xl border-outline-variant bg-surface-container-lowest px-4 text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-elev1 transition-all hover:bg-primary/90 hover:shadow-elev2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  查询中
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  查询
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <section className="mt-4 flex items-start gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container/60 px-4 py-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground md:text-[13px]">
            本评分为本项目自行评估的结果，<span className="text-foreground/80 font-medium">并非 Valve 官方信誉因子</span>。
            满分 100，最低 0，评分细则与算法详见{" "}
            <a
              href="https://github.com/naranyinyun/csTrustFactor"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              GitHub 仓库
            </a>
            。
          </p>
        </section>

        {/* Results */}
        {data && tone && (
          <section className="mt-6 grid gap-4">
            <article
              className={cn(
                "relative overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface-container p-6 shadow-elev1 md:p-8",
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl",
                  tone.barClass,
                )}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    信誉评分
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-[68px] font-semibold leading-none tracking-tight md:text-[88px]">
                      {Math.round(data.score)}
                    </span>
                    <span className="text-lg text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                    tone.chipClass,
                  )}
                >
                  <tone.Icon className="h-3.5 w-3.5" />
                  {tone.label}
                </span>
              </div>
              <div className="relative mt-7 h-2.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 ease-out", tone.barClass)}
                  style={{ width: `${scoreClamped}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </article>

            <article className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-6 shadow-elev1 md:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  置信度
                </p>
                <span className="text-sm font-medium text-foreground/80">{confidencePct}%</span>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                算法对此次评分判定的把握程度。
              </p>
            </article>

            <article className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-6 shadow-elev1 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                判定理由
              </p>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                {data.reason}
              </p>
            </article>
          </section>
        )}
      </main>

      <footer className="border-t border-outline-variant/60 bg-surface-container-low/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row md:px-8">
          <span>© {new Date().getFullYear()} Nalanyinyun Gakuen Esports Iinkai</span>
          <div className="flex items-center gap-4">
            <a
              href="https://nalanyinyun.work"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary"
            >
              nalanyinyun.work
            </a>
            <a
              href="https://github.com/naranyinyun/csTrustFactor"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
