"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChartDataPoint } from "@/types";

interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  color?: string;
  showValues?: boolean;
  horizontal?: boolean;
  className?: string;
}

export function BarChart({
  data,
  title,
  height = 160,
  color = "#6366f1",
  showValues = false,
  horizontal = false,
  className,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data.length) {
    return <div className={cn("text-slate-600 text-xs text-center", className)}>No data</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {title && <h4 className="text-xs font-semibold text-slate-400">{title}</h4>}
        <div className="flex flex-col gap-2">
          {data.map((d, i) => {
            const pct = (d.value / max) * 100;
            const isHov = i === hoveredIndex;
            const barColor = d.color ?? color;

            return (
              <div
                key={i}
                className="flex items-center gap-2"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="text-[11px] text-slate-500 w-24 text-right truncate shrink-0">
                  {d.label}
                </span>
                <div className="flex-1 h-6 bg-[#1c2128] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                      opacity: hoveredIndex === null || isHov ? 1 : 0.4,
                    }}
                  />
                </div>
                {showValues && (
                  <span
                    className={cn(
                      "text-[11px] w-10 text-right shrink-0",
                      isHov ? "text-slate-200" : "text-slate-600"
                    )}
                  >
                    {d.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const svgWidth = Math.max(data.length * 36, 200);
  const padT = 16;
  const padB = 32;
  const padX = 12;
  const chartH = height - padT - padB;
  const barW = Math.max(Math.min((svgWidth - padX * 2) / data.length - 6, 40), 8);
  const step = (svgWidth - padX * 2) / data.length;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && <h4 className="text-xs font-semibold text-slate-400">{title}</h4>}
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="overflow-visible"
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + chartH * (1 - t);
          return (
            <g key={t}>
              <line x1={padX} y1={y} x2={svgWidth - padX} y2={y} stroke="#1c2128" strokeWidth={1} />
              <text x={padX - 4} y={y + 3} fontSize={9} fill="#475569" textAnchor="end">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * chartH, 2);
          const x = padX + i * step + (step - barW) / 2;
          const y = padT + chartH - barH;
          const barColor = d.color ?? color;
          const isHov = i === hoveredIndex;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={3} fill={barColor}
                opacity={hoveredIndex === null || isHov ? 0.9 : 0.3}
                className="transition-opacity duration-150"
              />
              {isHov && (
                <rect x={x - 1} y={padT} width={barW + 2} height={chartH}
                  rx={3} fill={barColor} opacity={0.08} />
              )}
              {(showValues || isHov) && (
                <text x={x + barW / 2} y={y - 4} fontSize={9} fill="#94a3b8" textAnchor="middle">
                  {d.value}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={padT + chartH + 14}
                fontSize={9}
                fill={isHov ? "#94a3b8" : "#475569"}
                textAnchor="middle"
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
