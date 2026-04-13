"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { Dependency } from "@/types";

interface DepNode {
  id: string;
  name: string;
  version: string;
  type: Dependency["type"];
  isOutdated: boolean;
  hasVulnerabilities: boolean;
  dependents: string[];
  dependencies: string[];
  x?: number;
  y?: number;
}

interface DependencyGraphProps {
  dependencies: Dependency[];
  title?: string;
  className?: string;
}

const TYPE_COLOR: Record<Dependency["type"], string> = {
  runtime: "#6366f1",
  dev: "#22d3ee",
  peer: "#a78bfa",
};

function buildNodes(deps: Dependency[]): DepNode[] {
  return deps.map((d) => ({
    id: d.name,
    name: d.name,
    version: d.version,
    type: d.type,
    isOutdated: d.isOutdated,
    hasVulnerabilities: d.hasVulnerabilities,
    dependents: [],
    dependencies: [],
  }));
}

function layoutCircle(nodes: DepNode[]): DepNode[] {
  const cx = 250;
  const cy = 200;
  const r = 150;
  return nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export function DependencyGraph({ dependencies, title, className }: DependencyGraphProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Dependency["type"] | "all">("all");

  const filtered = dependencies.filter((d) => {
    const matchesType = filter === "all" || d.type === filter;
    const matchesSearch =
      !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const nodes = layoutCircle(buildNodes(filtered));
  const selectedNode = selected ? nodes.find((n) => n.id === selected) : null;

  if (!dependencies.length) {
    return (
      <div className={cn("text-slate-600 text-xs text-center py-8", className)}>
        No dependencies found
      </div>
    );
  }

  const counts = {
    outdated: dependencies.filter((d) => d.isOutdated).length,
    vulnerable: dependencies.filter((d) => d.hasVulnerabilities).length,
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {title && <h4 className="text-xs font-semibold text-slate-400">{title}</h4>}

      {/* Stats */}
      <div className="flex items-center gap-4">
        <span className="text-[11px] text-slate-500">{dependencies.length} total</span>
        {counts.outdated > 0 && (
          <span className="text-[11px] text-amber-400">{counts.outdated} outdated</span>
        )}
        {counts.vulnerable > 0 && (
          <span className="text-[11px] text-red-400">{counts.vulnerable} vulnerable</span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {(["all", "runtime", "dev", "peer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded transition-colors",
                filter === t
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Graph */}
        <svg width={500} height={400} className="shrink-0 bg-[#050810] rounded-xl border border-[#1c2128]">
          {/* Radial grid */}
          <circle cx={250} cy={200} r={150} fill="none" stroke="#1c2128" strokeWidth={1} />
          <circle cx={250} cy={200} r={75} fill="none" stroke="#1c2128" strokeWidth={1} strokeDasharray="4 4" />

          {nodes.map((n) => {
            const x = n.x ?? 250;
            const y = n.y ?? 200;
            const isSelected = n.id === selected;
            const color = TYPE_COLOR[n.type];
            const hasProblem = n.isOutdated || n.hasVulnerabilities;

            return (
              <g
                key={n.id}
                className="cursor-pointer"
                onClick={() => setSelected(isSelected ? null : n.id)}
              >
                {/* Glow ring */}
                {hasProblem && (
                  <circle
                    cx={x} cy={y} r={14}
                    fill="none"
                    stroke={n.hasVulnerabilities ? "#f87171" : "#f59e0b"}
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                )}

                <circle
                  cx={x} cy={y} r={isSelected ? 11 : 8}
                  fill={color}
                  opacity={isSelected ? 1 : 0.75}
                  className="transition-all duration-150"
                />

                {/* Label */}
                <text
                  x={x}
                  y={y + 20}
                  fontSize={8}
                  fill={isSelected ? "#e2e8f0" : "#64748b"}
                  textAnchor="middle"
                >
                  {n.name.length > 12 ? n.name.slice(0, 11) + "…" : n.name}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          {(Object.entries(TYPE_COLOR) as [Dependency["type"], string][]).map(([type, color], i) => (
            <g key={type} transform={`translate(12,${370 - i * 14})`}>
              <circle cx={4} cy={0} r={4} fill={color} opacity={0.8} />
              <text x={12} y={4} fontSize={9} fill="#475569" dominantBaseline="middle">
                {type}
              </text>
            </g>
          ))}
        </svg>

        {/* Detail panel */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {selectedNode ? (
            <div className="bg-[#0D1117] border border-[#1c2128] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{selectedNode.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">v{selectedNode.version}</p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded border"
                  style={{
                    color: TYPE_COLOR[selectedNode.type],
                    borderColor: TYPE_COLOR[selectedNode.type] + "40",
                    backgroundColor: TYPE_COLOR[selectedNode.type] + "15",
                  }}
                >
                  {selectedNode.type}
                </span>
              </div>

              {selectedNode.isOutdated && (
                <div className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  Outdated — newer version available
                </div>
              )}
              {selectedNode.hasVulnerabilities && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  Security vulnerabilities detected
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0D1117] border border-[#1c2128] rounded-xl p-4 text-xs text-slate-600 flex items-center justify-center h-32">
              Click a node to see details
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0 max-h-48">
            {filtered.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => setSelected(selected === d.name ? null : d.name)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors",
                  selected === d.name
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5"
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLOR[d.type] }}
                />
                <span className="flex-1 truncate">{d.name}</span>
                <span className="text-slate-600 shrink-0">v{d.version}</span>
                {d.isOutdated && <span className="text-amber-500 text-[10px]">↑</span>}
                {d.hasVulnerabilities && <span className="text-red-500 text-[10px]">!</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
