"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChartDataPoint } from "@/types";

const DEFAULT_COLORS = [
  "#6366f1", "#22d3ee", "#34d399", "#f59e0b",
  "#f87171", "#a78bfa", "#fb923c", "#e879f9",
];

interface PieChartProps {
  data: ChartDataPoint[];
  size?: number;
  showLegend?: boolean;
  title?: string;
  donut?: boolean;
  className?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function PieChart({
  data,
  size = 200,
  showLegend = true,
  title,
  donut = false,
  className,
}: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className={cn("text-slate-600 text-xs text-center", className)}>No data</div>;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const innerR = donut ? r * 0.55 : 0;

  let cumAngle = 0;
  const slices = data.map((d, i) => {
    const startAngle = cumAngle;
    const sweep = (d.value / total) * 360;
    cumAngle += sweep;
    return { ...d, startAngle, endAngle: cumAngle, sweep, color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] };
  });

  const hovered = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {title && <h4 className="text-xs font-semibold text-slate-400">{title}</h4>}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width={size} height={size}>
            {slices.map((slice, i) => {
              const isHov = i === hoveredIndex;
              const scaledR = isHov ? r + 4 : r;
              const start = polarToCartesian(cx, cy, scaledR, slice.endAngle);
              const end = polarToCartesian(cx, cy, scaledR, slice.startAngle);
              const largeArc = slice.sweep > 180 ? 1 : 0;

              let path: string;
              if (donut) {
                const startOuter = polarToCartesian(cx, cy, scaledR, slice.startAngle);
                const endOuter = polarToCartesian(cx, cy, scaledR, slice.endAngle);
                const startInner = polarToCartesian(cx, cy, innerR, slice.endAngle);
                const endInner = polarToCartesian(cx, cy, innerR, slice.startAngle);
                path = `M ${startOuter.x} ${startOuter.y} A ${scaledR} ${scaledR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} L ${startInner.x} ${startInner.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y} Z`;
              } else {
                path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${scaledR} ${scaledR} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
              }

              return (
                <path
                  key={i}
                  d={path}
                  fill={slice.color}
                  opacity={hoveredIndex === null || isHov ? 0.9 : 0.4}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}

            {donut && (
              <circle cx={cx} cy={cy} r={innerR - 2} fill="#050810" />
            )}

            {hovered && (
              <text x={cx} y={cy - 6} textAnchor="middle" className="pointer-events-none">
                <tspan x={cx} dy="0" fontSize={14} fontWeight={600} fill="#f1f5f9">{((hovered.value / total) * 100).toFixed(1)}%</tspan>
                <tspan x={cx} dy={16} fontSize={10} fill="#64748b">{hovered.label}</tspan>
              </text>
            )}
          </svg>
        </div>

        {showLegend && (
          <ul className="flex flex-col gap-1.5">
            {slices.map((slice, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 text-xs cursor-default transition-opacity",
                  hoveredIndex !== null && hoveredIndex !== i && "opacity-40"
                )}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-slate-400 truncate max-w-[120px]">{slice.label}</span>
                <span className="text-slate-600 ml-auto pl-3">
                  {((slice.value / total) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
