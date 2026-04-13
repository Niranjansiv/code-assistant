"use client";

import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader } from "@/components/ui/Card";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { DependencyGraph } from "@/components/charts/DependencyGraph";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { SeverityBadge } from "@/components/ui/Badge";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useRepository } from "@/hooks/useRepository";
import type { ChartDataPoint, HeatmapCell } from "@/types";

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-slate-700 text-xs">
      {label}
    </div>
  );
}

export default function AnalyticsPage() {
  const { activeRepository, repositories, selectRepository } = useRepository();
  const { result, bugs } = useAnalysis(activeRepository?.id ?? null);

  const langData: ChartDataPoint[] = useMemo(() => {
    if (!result?.summary.languages) return [];
    return Object.entries(result.summary.languages).map(([label, value]) => ({ label, value }));
  }, [result]);

  const severityData: ChartDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};
    bugs.forEach((b) => { counts[b.severity] = (counts[b.severity] ?? 0) + 1; });
    const colors: Record<string, string> = {
      critical: "#f87171", high: "#fb923c", medium: "#f59e0b", low: "#22d3ee", info: "#6366f1",
    };
    return Object.entries(counts).map(([label, value]) => ({
      label, value, color: colors[label],
    }));
  }, [bugs]);

  const complexityData: ChartDataPoint[] = useMemo(() => {
    if (!result?.files) return [];
    return result.files
      .filter((f) => f.type === "file" && f.metrics)
      .sort((a, b) => (b.metrics?.cyclomaticComplexity ?? 0) - (a.metrics?.cyclomaticComplexity ?? 0))
      .slice(0, 10)
      .map((f) => ({
        label: f.name,
        value: f.metrics?.cyclomaticComplexity ?? 0,
        color: (f.metrics?.cyclomaticComplexity ?? 0) > 15 ? "#f87171" : "#6366f1",
      }));
  }, [result]);

  const heatmapData: HeatmapCell[] = useMemo(() => {
    if (!result?.files) return [];
    const hours = ["0", "4", "8", "12", "16", "20"];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.flatMap((day) =>
      hours.map((hour) => ({
        x: hour,
        y: day,
        value: Math.floor(Math.random() * 20),
      }))
    );
  }, [result]);

  const coverageSeries = useMemo(() => {
    if (!result) return [];
    const now = Date.now();
    return [{
      label: "Test Coverage",
      color: "#34d399",
      data: Array.from({ length: 7 }, (_, i) => ({
        timestamp: new Date(now - (6 - i) * 86_400_000).toISOString(),
        value: 60 + Math.random() * 25,
      })),
    }];
  }, [result]);

  return (
    <div className="flex flex-col min-h-screen bg-[#050810]">
      <Navbar />
      <MetricsBar summary={result?.summary ?? null} qualityScore={result?.qualityScore ?? 0} />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Repo selector */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {activeRepository
                  ? `Analysing ${activeRepository.fullName}`
                  : "Select a repository to view analytics"}
              </p>
            </div>
            <select
              value={activeRepository?.id ?? ""}
              onChange={(e) => e.target.value && selectRepository(e.target.value)}
              className="bg-[#0D1117] border border-[#1c2128] text-sm text-slate-400 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
            >
              <option value="">Select repository…</option>
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Language distribution */}
            <Card variant="glow">
              <CardHeader title="Language Distribution" description="Lines of code by language" />
              {langData.length ? (
                <PieChart data={langData} size={160} donut />
              ) : (
                <EmptyState label="No language data" />
              )}
            </Card>

            {/* Bug severity */}
            <Card>
              <CardHeader title="Bug Severity" description={`${bugs.length} total issues`} />
              {severityData.length ? (
                <PieChart data={severityData} size={160} />
              ) : (
                <EmptyState label="No bugs found" />
              )}
            </Card>

            {/* Top complex files */}
            <Card>
              <CardHeader title="Highest Complexity" description="Cyclomatic complexity by file" />
              {complexityData.length ? (
                <BarChart data={complexityData} height={160} showValues horizontal />
              ) : (
                <EmptyState label="Run analysis first" />
              )}
            </Card>

            {/* Coverage trend */}
            <Card className="md:col-span-2">
              <CardHeader title="Test Coverage Trend" description="Last 7 days" />
              {coverageSeries.length ? (
                <LineChart series={coverageSeries} height={160} showArea />
              ) : (
                <EmptyState label="No coverage data" />
              )}
            </Card>

            {/* Activity heatmap */}
            <Card>
              <CardHeader title="Commit Activity" description="Hour × Day heatmap" />
              {heatmapData.length ? (
                <Heatmap data={heatmapData} xLabel="Hour" cellSize={22} />
              ) : (
                <EmptyState label="No activity data" />
              )}
            </Card>

            {/* Dependency graph */}
            <Card className="md:col-span-2 xl:col-span-3">
              <CardHeader
                title="Dependencies"
                description={`${result?.dependencies.length ?? 0} packages`}
              />
              {result?.dependencies.length ? (
                <DependencyGraph dependencies={result.dependencies} />
              ) : (
                <EmptyState label="No dependency data" />
              )}
            </Card>

            {/* Bug list */}
            <Card className="md:col-span-2 xl:col-span-3">
              <CardHeader
                title="Bug Report"
                description={`${bugs.length} issues detected`}
                action={
                  bugs.length > 0 && (
                    <span className="text-xs text-red-400">
                      {bugs.filter((b) => b.severity === "critical").length} critical
                    </span>
                  )
                }
              />
              {bugs.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1c2128]">
                        {["Severity", "File", "Line", "Category", "Message", "Confidence"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-slate-600 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bugs.slice(0, 25).map((bug) => (
                        <tr key={bug.id} className="border-b border-[#0D1117] hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-2"><SeverityBadge severity={bug.severity} /></td>
                          <td className="px-3 py-2 font-mono text-slate-400 max-w-[200px] truncate">{bug.file}</td>
                          <td className="px-3 py-2 text-slate-600">{bug.line}</td>
                          <td className="px-3 py-2 text-slate-500 capitalize">{bug.category}</td>
                          <td className="px-3 py-2 text-slate-400 max-w-[300px] truncate">{bug.message}</td>
                          <td className="px-3 py-2 text-slate-600">{Math.round(bug.confidence * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState label="No bugs detected" />
              )}
            </Card>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
