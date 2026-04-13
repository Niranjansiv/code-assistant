import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Syne, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-spacemono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "DeepTrace", template: "%s | DeepTrace" },
  description:
    "AI-augmented code archaeology and runtime flow analyser. Import GitHub repos, visualise execution graphs, detect bugs, and analyse complexity metrics.",
  keywords: ["code analysis", "flow graph", "bug detection", "AI", "GitHub", "complexity"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${syne.variable} ${spaceMono.variable}`}>
      <body className="bg-[#050810] text-slate-100 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
