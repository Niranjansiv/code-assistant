"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { FlowEdge, FlowGraph as FlowGraphType, FlowNode } from "@/types";

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 140;
const NODE_H = 48;
const H_GAP = 80;
const V_GAP = 60;

const NODE_TYPE_STYLES: Record<FlowNode["type"], string> = {
  entry:    "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
  exit:     "border-red-500/60    bg-red-500/10     text-red-300",
  function: "border-indigo-500/40 bg-indigo-500/8   text-indigo-200",
  class:    "border-violet-500/40 bg-violet-500/8   text-violet-200",
  module:   "border-sky-500/40   bg-sky-500/8      text-sky-200",
  branch:   "border-amber-500/40 bg-amber-500/8    text-amber-200",
  loop:     "border-orange-500/40 bg-orange-500/8   text-orange-200",
};

const EDGE_TYPE_STROKE: Record<FlowEdge["type"], string> = {
  call:        "#6366f1",
  import:      "#22d3ee",
  extends:     "#a78bfa",
  implements:  "#34d399",
  conditional: "#f59e0b",
};

// ── Minimap ───────────────────────────────────────────────────────────────────

interface MinimapProps {
  nodes: (FlowNode & { x: number; y: number })[];
  viewBox: { x: number; y: number; w: number; h: number };
  totalW: number;
  totalH: number;
}

function Minimap({ nodes, viewBox, totalW, totalH }: MinimapProps) {
  const scale = 120 / Math.max(totalW, 1);
  return (
    <div className="absolute bottom-4 right-4 bg-[#0D1117]/90 border border-[#30363d] rounded-lg p-2 backdrop-blur">
      <svg width={120} height={80} className="block">
        {nodes.map((n) => (
          <rect
            key={n.id}
            x={n.x * scale}
            y={(n.y / (totalH || 1)) * 80}
            width={NODE_W * scale}
            height={NODE_H * (80 / Math.max(totalH, 1))}
            rx={2}
            className="fill-indigo-500/40"
          />
        ))}
        <rect
          x={viewBox.x * scale}
          y={(viewBox.y / Math.max(totalH, 1)) * 80}
          width={viewBox.w * scale}
          height={(viewBox.h / Math.max(totalH, 1)) * 80}
          rx={2}
          fill="none"
          stroke="#6366f1"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

// ── FlowGraph ─────────────────────────────────────────────────────────────────

interface FlowGraphProps {
  graph: FlowGraphType | null;
  onNodeClick?: (node: FlowNode) => void;
  className?: string;
}

export function FlowGraph({ graph, onNodeClick, className }: FlowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);

  // Simple layered layout
  const laid = useCallback(
    (nodes: FlowNode[]): (FlowNode & { x: number; y: number })[] => {
      const visited = new Set<string>();
      const layers: string[][] = [];

      const entryIds = new Set(graph?.entryPoints ?? []);
      const queue = nodes.filter((n) => entryIds.has(n.id) || n.calledBy.length === 0);

      while (queue.length) {
        const layer: string[] = [];
        const next: FlowNode[] = [];
        for (const n of queue) {
          if (!visited.has(n.id)) {
            visited.add(n.id);
            layer.push(n.id);
          }
          const children = nodes.filter(
            (c) => n.calls.includes(c.id) && !visited.has(c.id)
          );
          next.push(...children);
        }
        if (layer.length) layers.push(layer);
        queue.length = 0;
        queue.push(...next);
      }

      // Unvisited fall into last layer
      nodes.forEach((n) => {
        if (!visited.has(n.id)) layers[layers.length - 1]?.push(n.id) ?? layers.push([n.id]);
      });

      const idToLayer = new Map<string, number>();
      layers.forEach((l, li) => l.forEach((id) => idToLayer.set(id, li)));

      return nodes.map((n) => {
        const li = idToLayer.get(n.id) ?? 0;
        const siblingsInLayer = layers[li] ?? [];
        const si = siblingsInLayer.indexOf(n.id);
        return {
          ...n,
          x: li * (NODE_W + H_GAP),
          y: si * (NODE_H + V_GAP),
        };
      });
    },
    [graph]
  );

  const laidNodes = graph ? laid(graph.nodes) : [];
  const nodeMap = new Map(laidNodes.map((n) => [n.id, n]));
  const totalW = Math.max(...laidNodes.map((n) => n.x + NODE_W), 400);
  const totalH = Math.max(...laidNodes.map((n) => n.y + NODE_H), 300);

  // Pan events
  const onMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const onMouseUp = () => setIsPanning(false);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.2, z - e.deltaY * 0.001)));
  };

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-slate-600 gap-3", className)}>
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm">Run analysis to view the execution flow graph</p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-[#050810]", className)}>
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <Button variant="secondary" size="xs" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>+</Button>
        <Button variant="secondary" size="xs" onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}>−</Button>
        <Button variant="secondary" size="xs" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
          Reset
        </Button>
        <span className="text-[10px] text-slate-600">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 bg-[#0D1117]/80 border border-[#1c2128] rounded-lg px-3 py-2 backdrop-blur">
        <div className="flex flex-col gap-1">
          {(Object.entries(EDGE_TYPE_STROKE) as [FlowEdge["type"], string][]).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-6 h-px" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-slate-500 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        className={cn("w-full h-full", isPanning ? "cursor-grabbing" : "cursor-grab")}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {Object.entries(EDGE_TYPE_STROKE).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>

        <g transform={`translate(${pan.x + 40},${pan.y + 40}) scale(${zoom})`}>
          {/* Edges */}
          {graph.edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            const x1 = src.x + NODE_W;
            const y1 = src.y + NODE_H / 2;
            const x2 = tgt.x;
            const y2 = tgt.y + NODE_H / 2;
            const cx = (x1 + x2) / 2;
            const stroke = EDGE_TYPE_STROKE[edge.type] ?? "#6366f1";

            return (
              <path
                key={edge.id}
                d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                stroke={stroke}
                strokeWidth={edge.weight > 1 ? 1.5 : 1}
                fill="none"
                opacity={0.6}
                markerEnd={`url(#arrow-${edge.type})`}
              />
            );
          })}

          {/* Nodes */}
          {laidNodes.map((node) => {
            const isSelected = selected === node.id;
            const styles = NODE_TYPE_STYLES[node.type];

            return (
              <foreignObject
                key={node.id}
                x={node.x}
                y={node.y}
                width={NODE_W}
                height={NODE_H}
                className="overflow-visible"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(node.id);
                    onNodeClick?.(node);
                  }}
                  className={cn(
                    "h-full rounded-lg border px-2.5 flex flex-col justify-center cursor-pointer transition-all text-[11px]",
                    styles,
                    isSelected && "ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#050810]"
                  )}
                >
                  <span className="font-semibold truncate">{node.label}</span>
                  <span className="text-[9px] opacity-50 truncate">{node.file}</span>
                </div>
              </foreignObject>
            );
          })}
        </g>
      </svg>

      <Minimap nodes={laidNodes} viewBox={{ x: -pan.x / zoom, y: -pan.y / zoom, w: 800 / zoom, h: 600 / zoom }} totalW={totalW} totalH={totalH} />
    </div>
  );
}
