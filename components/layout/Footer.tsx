import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import",    label: "Import"    },
  { href: "/analytics", label: "Analytics" },
  { href: "/assistant", label: "Assistant" },
];

export function Footer() {
  return (
    <footer className="border-t border-[#1c2128] bg-[#050810]">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-slate-100">
              Deep<span className="text-indigo-400">Trace</span>
            </span>
            <p className="text-xs text-slate-600 max-w-xs">
              AI-augmented code archaeology & runtime flow analyser for modern engineering teams.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t border-[#1c2128] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-700">
            &copy; {new Date().getFullYear()} DeepTrace. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-700">
            <span>Powered by</span>
            <span className="text-indigo-500 font-medium">Claude AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
