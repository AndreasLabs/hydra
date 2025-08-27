import { useCallback, useEffect, useMemo, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Stats = { fileCount: number; totalSize: number };

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(value >= 100 || value % 1 === 0 ? 0 : 1)} ${units[idx]}`;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/stats`);
      if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
      const data = (await res.json()) as Stats;
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = useMemo(() => (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Files</CardTitle>
          <CardDescription>Total number of objects in storage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : (
            <div className="text-3xl font-semibold">{stats?.fileCount ?? 0}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Size</CardTitle>
          <CardDescription>Sum of object sizes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
          ) : (
            <div className="text-3xl font-semibold">{formatBytes(stats?.totalSize ?? 0)}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refresh</CardTitle>
          <CardDescription>Fetch latest statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardContent>
      </Card>
    </div>
  ), [loading, stats, load]);

  return (
    <div className={`${geistSans.className} ${geistMono.className} font-sans`}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:gap-10 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hydra Home</h1>
          <p className="text-muted-foreground mt-1">Generic storage statistics from MinIO</p>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {cards}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href="/files">Browse Files</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/datasets">View Datasets</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/workflow-jobs">Workflow Jobs</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
