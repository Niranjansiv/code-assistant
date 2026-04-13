"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { HeatmapCell } from "@/types";

interface HeatmapProps {
  data: HeatmapCell[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  colorStart?: string;
  colorEnd?: string;
  cellSize?: number;
  className?: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function interpolateColor(start: string, end: string, t: number): string {
  const s = hexToRgb(start);
  const e = hexToRgb(end);
  const r = Math.round(lerp(s[0], e[0], t));
  const g = Math.round(lerp(s[1], e[1], t));
  const b = Math.round(lerp(s[2], e[2], t));
  return `rgb(${r},${g},${b})`;
}

export function Heatmap({
  data,
  title,
  xLabel,
  yLabel,
  colorStart = "#0f172a",
  colorEnd = "#6366f1",
  cellSize = 28,
  className,
}: HeatmapProps) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  if (!data.length) {
    return <div className={cn("text-slate-600 text-xs text-center", className)}>No data</div>;
  }

  const xs = [...new Set(data.map((d) => d.x))].sort();
  const ys = [...new Set(data.map((d) => d.y))].sort();
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, minVal + 1);

  function cellAt(x: string, y: string): HeatmapCell | undefined {
    return data.find((d) => d.x === x && d.y === y);
  }

  const labelW = 64;
  const labelH = 64;
  const gap = 2;
  const svgW = labelW + xs.length * (cellSize + gap);
  const svgH = labelH + ys.length * (cellSize + gap);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && <h4 className="text-xs font-semibold text-slate-400">{title}</h4>}

      <div className="relative overflow-auto">
        <svg width={svgW} height={svgH}>
          {/* X-axis labels */}
          {xs.map((x, xi) => (
            <text
              key={x}
              x={labelW + xi * (cellSize + gap) + cellSize / 2}
              y={labelH - 8}
              fontSize={9}
              fill="#475569"
              textAnchor="middle"
            >
              {x.length > 5 ? x.slice(0, 4) + "…" : x}
            </text>
          ))}

          {/* Y-axis labels */}
          {ys.map((y, yi) => (
            <text
              key={y}
              x={labelW - 6}
              y={labelH + yi * (cellSize + gap) + cellSize / 2 + 3}
              fontSize={9}
              fill="#475569"
              textAnchor="end"
            >
              {y.length > 7 ? y.slice(0, 6) + "…" : y}
            </text>
          ))}

          {/* Cells */}
          {ys.map((y, yi) =>
            xs.map((x, xi) => {
              const cell = cellAt(x, y);
              const t = cell ? (cell.value - minVal) / (maxVal - minVal) : 0;
              const color = interpolateColor(colorStart, colorEnd, t);
              const isHov = hovered?.x === x && hovered?.y === y;

              return (
                <rect
                  key={`${x}-${y}`}
                  x={labelW + xi * (cellSize + gap)}
                  y={labelH + yi * (cellSize + gap)}
                  width={cellSize}
                  height={cellSize}
                  rx={3}
                  fill={color}
                  opacity={cell ? (isHov ? 1 : 0.85) : 0.15}
                  className="cursor-pointer transition-opacity duration-100"
                  onMouseEnter={() => cell && setHovered(cell)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })
          )}

          {/* Axis labels */}
          {xLabel && (
            <text
              x={labelW + (xs.length * (cellSize + gap)) / 2}
              y={svgH}
              fontSize={10}
              fill="#64748b"
              textAnchor="middle"
            >
              {xLabel}
            </text>
          )}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div className="absolute top-2 right-2 bg-[#0D1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs pointer-events-none shadow-xl">
            <p className="text-slate-300 font-medium">{hovered.label ?? `${hovered.x} × ${hovered.y}`}</p>
            <p className="text-slate-500">
              {hovered.x} / {hovered.y}
            </p>
            <p className="text-indigo-400 font-semibold mt-0.5">{hovered.value}</p>
          </div>
        )}
      </div>

      {/* Colour scale legend */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-slate-600">{minVal}</span>
        <div
          className="flex-1 h-2 rounded"
          style={{
            background: `linear-gradient(to right, ${colorStart}, ${colorEnd})`,
          }}
        />
        <span className="text-[10px] text-slate-600">{maxVal}</span>
      </div>
    </div>
  );
}
