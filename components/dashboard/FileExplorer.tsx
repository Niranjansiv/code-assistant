"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/Input";
import type { FileNode } from "@/types";

// ── Language → colour dot ─────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  ts: "bg-blue-400",
  tsx: "bg-blue-400",
  js: "bg-yellow-400",
  jsx: "bg-yellow-400",
  py: "bg-green-400",
  go: "bg-cyan-400",
  rs: "bg-orange-400",
  java: "bg-red-400",
  cs: "bg-purple-400",
  cpp: "bg-indigo-400",
  c: "bg-indigo-400",
  css: "bg-pink-400",
  scss: "bg-pink-400",
  html: "bg-orange-400",
  json: "bg-yellow-300",
  md: "bg-slate-400",
};

function langDotColor(ext?: string): string {
  return ext ? (LANG_COLORS[ext] ?? "bg-slate-600") : "bg-slate-600";
}

// ── FileItem ──────────────────────────────────────────────────────────────────

interface FileItemProps {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  onSelect: (node: FileNode) => void;
}

function FileItem({ node, depth, activeFilePath, onSelect }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isDir = node.type === "directory";
  const isActive = node.path === activeFilePath;

  return (
    <li>
      <button
        type="button"
        onClick={() => (isDir ? setIsOpen((o) => !o) : onSelect(node))}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-[3px] rounded text-xs text-left transition-colors",
          isActive
            ? "text-indigo-400 bg-indigo-500/10"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Chevron for dirs */}
        {isDir ? (
          <svg
            className={cn("w-3 h-3 shrink-0 transition-transform text-slate-600", isOpen && "rotate-90")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", langDotColor(node.extension))} />
        )}

        {/* Icon */}
        {isDir ? (
          <svg className="w-3.5 h-3.5 shrink-0 text-indigo-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}

        <span className="truncate flex-1">{node.name}</span>

        {/* Complexity badge */}
        {node.metrics && node.metrics.cyclomaticComplexity > 10 && (
          <span className="text-[9px] px-1 rounded bg-red-500/15 text-red-400 shrink-0">
            {node.metrics.cyclomaticComplexity}
          </span>
        )}
      </button>

      {isDir && isOpen && node.children && (
        <ul>
          {node.children.map((child) => (
            <FileItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── FileExplorer ──────────────────────────────────────────────────────────────

interface FileExplorerProps {
  tree: FileNode[];
  activeFilePath?: string | null;
  onFileSelect?: (node: FileNode) => void;
  className?: string;
}

export function FileExplorer({
  tree,
  activeFilePath = null,
  onFileSelect,
  className,
}: FileExplorerProps) {
  const [search, setSearch] = useState("");

  function flatten(nodes: FileNode[]): FileNode[] {
    return nodes.flatMap((n) =>
      n.type === "file" ? [n] : flatten(n.children ?? [])
    );
  }

  const filtered = search
    ? flatten(tree).filter((n) =>
        n.path.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className={cn("flex flex-col gap-2 h-full", className)}>
      <div className="px-2 pt-2">
        <SearchInput
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          inputSize="sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-2">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs">
            No files loaded
          </div>
        ) : filtered ? (
          <ul className="py-1">
            {filtered.length === 0 ? (
              <li className="text-xs text-slate-600 text-center py-4">No results</li>
            ) : (
              filtered.map((node) => (
                <FileItem
                  key={node.id}
                  node={node}
                  depth={0}
                  activeFilePath={activeFilePath}
                  onSelect={onFileSelect ?? (() => {})}
                />
              ))
            )}
          </ul>
        ) : (
          <ul className="py-1">
            {tree.map((node) => (
              <FileItem
                key={node.id}
                node={node}
                depth={0}
                activeFilePath={activeFilePath}
                onSelect={onFileSelect ?? (() => {})}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
