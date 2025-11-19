"use client";

export interface WalletTheme {
  gradient: string;
  accent: string;
  accentMuted: string;
  hash: number;
  seed: string;
}

const THEMES = [
  { gradient: "from-emerald-700 via-green-600 to-teal-600", accent: "#34d399", accentMuted: "#6ee7b7" },
  { gradient: "from-blue-700 via-indigo-600 to-cyan-600", accent: "#38bdf8", accentMuted: "#93c5fd" },
  { gradient: "from-purple-700 via-violet-600 to-indigo-600", accent: "#c084fc", accentMuted: "#a78bfa" },
  { gradient: "from-rose-700 via-pink-600 to-purple-600", accent: "#fb7185", accentMuted: "#f472b6" },
  { gradient: "from-amber-700 via-orange-600 to-red-600", accent: "#fb923c", accentMuted: "#fcd34d" },
  { gradient: "from-teal-700 via-cyan-600 to-blue-600", accent: "#14b8a6", accentMuted: "#5eead4" },
  { gradient: "from-indigo-700 via-purple-600 to-pink-600", accent: "#818cf8", accentMuted: "#f9a8d4" },
  { gradient: "from-green-700 via-emerald-600 to-cyan-600", accent: "#22c55e", accentMuted: "#4ade80" },
  { gradient: "from-violet-700 via-purple-600 to-indigo-600", accent: "#a855f7", accentMuted: "#c4b5fd" },
  { gradient: "from-cyan-700 via-blue-600 to-teal-600", accent: "#06b6d4", accentMuted: "#67e8f9" },
  { gradient: "from-lime-700 via-green-600 to-emerald-600", accent: "#84cc16", accentMuted: "#bef264" },
  { gradient: "from-sky-700 via-blue-600 to-indigo-600", accent: "#38bdf8", accentMuted: "#bae6fd" },
];

const hashValue = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const getWalletTheme = (address?: string): WalletTheme => {
  const seed = (address ?? "anonymous").toLowerCase();
  const hash = hashValue(seed);
  const palette = THEMES[hash % THEMES.length];
  return {
    ...palette,
    hash,
    seed,
  };
};

export const getWalletGradientClass = (address?: string) => getWalletTheme(address).gradient;
