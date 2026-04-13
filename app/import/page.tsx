"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRepository } from "@/hooks/useRepository";
import { parseGitHubUrl } from "@/lib/github";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { Repository } from "@/types";

function RepoCard({ repo, onSelect }: { repo: Repository; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left p-4 bg-[#0D1117] border border-[#1c2128] rounded-xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
            {repo.fullName}
          </p>
          {repo.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{repo.description}</p>
          )}
        </div>
        {repo.isPrivate && <Badge variant="muted" size="xs">Private</Badge>}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-slate-600">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            {repo.language}
          </span>
        )}
        <span>★ {formatNumber(repo.stars)}</span>
        <span>{formatNumber(repo.forks)} forks</span>
        <span className="ml-auto">{timeAgo(repo.updatedAt)}</span>
      </div>
    </button>
  );
}

export default function ImportPage() {
  const router = useRouter();
  const { repositories, importRepository, isImporting, error } = useRepository();
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [urlError, setUrlError] = useState("");
  const [importedRepo, setImportedRepo] = useState<Repository | null>(null);

  function validateUrl(value: string): boolean {
    const parsed = parseGitHubUrl(value);
    if (!parsed) {
      setUrlError("Please enter a valid GitHub URL (e.g. https://github.com/owner/repo)");
      return false;
    }
    setUrlError("");
    return true;
  }

  async function handleImport() {
    if (!validateUrl(url)) return;
    const repo = await importRepository(url, branch || undefined);
    if (repo) {
      setImportedRepo(repo);
    }
  }

  function handleAnalyse(repoId: string) {
    router.push(`/dashboard?repo=${repoId}`);
  }

  const EXAMPLE_REPOS = [
    "https://github.com/vercel/next.js",
    "https://github.com/facebook/react",
    "https://github.com/microsoft/TypeScript",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#050810]">
      <Navbar />

      <main className="flex-1 max-w-screen-lg mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Import Repository</h1>
          <p className="text-slate-500">
            Import a GitHub repository to start analysing its codebase with DeepTrace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Import form */}
          <div className="flex flex-col gap-6">
            <Card variant="bordered">
              <CardHeader
                title="GitHub Repository"
                description="Paste a GitHub URL to import"
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                }
              />

              <div className="flex flex-col gap-4">
                <Input
                  label="Repository URL"
                  placeholder="https://github.com/owner/repo"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) validateUrl(e.target.value);
                  }}
                  error={urlError}
                  leftElement={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    </svg>
                  }
                />

                <Input
                  label="Branch (optional)"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  hint="Defaults to the repository's default branch"
                />

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  isLoading={isImporting}
                  onClick={handleImport}
                  disabled={!url.trim()}
                  className="w-full"
                >
                  {isImporting ? "Importing…" : "Import Repository"}
                </Button>
              </div>
            </Card>

            {/* Example repos */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Try an example</p>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_REPOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUrl(r)}
                    className="text-left text-xs text-slate-500 hover:text-indigo-400 transition-colors font-mono px-3 py-1.5 rounded-lg border border-[#1c2128] hover:border-indigo-500/30 bg-[#0D1117]"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Success state */}
            {importedRepo && (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-emerald-300">
                    Repository imported!
                  </span>
                </div>
                <p className="text-xs text-emerald-600 mb-4">{importedRepo.fullName}</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAnalyse(importedRepo.id)}
                  className="w-full"
                >
                  Open in Dashboard →
                </Button>
              </div>
            )}

            {/* Imported repos list */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">
                Imported repositories ({repositories.length})
              </p>
              {repositories.length === 0 ? (
                <div className="text-xs text-slate-700 text-center py-8 border border-[#1c2128] rounded-xl bg-[#0D1117]">
                  No repositories imported yet
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {repositories.map((repo) => (
                    <RepoCard
                      key={repo.id}
                      repo={repo}
                      onSelect={() => handleAnalyse(repo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
