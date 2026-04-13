"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TimeSeriesPoint } from "@/types";

interface LineChartSeries {
  label: string;
  data: TimeSeriesPoint[];
  color?: string;
}

interface LineChartProps {
  series: LineChartSeries[];
  title?: string;
  height?: number;
  showDots?: boolean;
  showArea?: boolean;
  className?: string;
}

const SERIES_COLORS = ["#6366f1", "#22d3ee", "#34d399", "#f59e0b", "#f87171"];

function formatLabel(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric" });
  } catch {
    return ts;
  }
}

export function LineChart({
  series,
  title,
  height = 180,
  showDots = true,
  showArea = true,
  className,
}: LineChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    items: { label: string; value: number; color: string }[];
  } | null>(null);

  if (!series.length || series.every((s) => !s.data.length)) {
    return <div className={cn("text-slate-600 text-xs text-center", className)}>No data</div>;
  }

  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const allTimestamps = series.flatMap((s) => s.data.map((d) => d.timestamp));
  const uniqueTs = [...new Set(allTimestamps)].sort();

  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues, minV + 1);
  const padT = 16;
  const padB = 28;
  const padX = 36;
  const W = 500;
  const chartH = height - padT - padB;
  const chartW = W - padX * 2;

  function toX(ts: string): number {
    const i = uniqueTs.indexOf(ts);
    if (uniqueTs.length <= 1) return padX + chartW / 2;
    return padX + (i / (uniqueTs.length - 1)) * chartW;
  }

  function toY(v: number): number {
    return padT + chartH - ((v - minV) / (maxV - minV)) * chartH;
  }

  function buildPath(data: TimeSeriesPoint[]): string {
    const sorted = [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return sorted
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(d.timestamp)} ${toY(d.value)}`)
      .join(" ");
  }

  function buildArea(data: TimeSeriesPoint[]): string {
    const sorted = [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    if (!sorted.length) return "";
    const line = sorted.map((d) => `L ${toX(d.timestamp)} ${toY(d.value)}`).join(" ");
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return `M ${toX(first.timestamp)} ${padT + chartH} L ${toX(first.timestamp)} ${toY(first.value)} ${line} L ${toX(last.timestamp)} ${padT + chartH} Z`;
  }

  return (
    <div className={cn("flex flex-col gap-2 relative", className)}>
      {title && <h4 className="text-xs font-semibold text-slate-400">{title}</h4>}

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${height}`}
        onMouseLeave={() => setTooltip(null)}
        className="overflow-visible"
      >
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? SERIES_COLORS[i % SERIES_COLORS.length];
            return (
              <linearGradient key={i} id={`area-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + chartH * (1 - t);
          const v = minV + (maxV - minV) * t;
          return (
            <g key={t}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#1c2128" strokeWidth={1} />
              <text x={padX - 6} y={y + 3} fontSize={9} fill="#475569" textAnchor="end">
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {uniqueTs
          .filter((_, i) => i % Math.max(1, Math.floor(uniqueTs.length / 6)) === 0)
          .map((ts) => (
            <text
              key={ts}
              x={toX(ts)}
              y={padT + chartH + 16}
              fontSize={9}
              fill="#475569"
              textAnchor="middle"
            >
              {formatLabel(ts)}
            </text>
          ))}

        {/* Series */}
        {series.map((s, si) => {
          const color = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
          return (
            <g key={si}>
              {showArea && (
                <path d={buildArea(s.data)} fill={`url(#area-grad-${si})`} />
              )}
              <path
                d={buildPath(s.data)}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {showDots &&
                s.data.map((d, di) => (
                  <circle
                    key={di}
                    cx={toX(d.timestamp)}
                    cy={toY(d.value)}
                    r={3}
                    fill={color}
                    stroke="#050810"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setTooltip({
                        x: toX(d.timestamp),
                        y: toY(d.value),
                        items: [{ label: s.label, value: d.value, color }],
                      });
                    }}
                  />
                ))}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + chartH}
              stroke="#30363d" strokeWidth={1} strokeDasharray="3 3" />
            <foreignObject x={tooltip.x - 50} y={tooltip.y - 40} width={100} height={36}>
              <div className="bg-[#0D1117] border border-[#30363d] rounded px-2 py-1 text-[10px] text-slate-300 text-center shadow">
                {tooltip.items.map((it, i) => (
                  <div key={i}>
                    <span style={{ color: it.color }}>{it.label}: </span>
                    <span>{it.value}</span>
                  </div>
                ))}
              </div>
            </foreignObject>
          </g>
        )}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div className="flex flex-wrap items-center gap-4">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-6 h-0.5 rounded"
                style={{ backgroundColor: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }}
              />
              <span className="text-[10px] text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
