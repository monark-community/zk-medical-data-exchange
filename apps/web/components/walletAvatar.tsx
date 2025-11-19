"use client";

import { useMemo } from "react";
import { getWalletTheme } from "@/lib/walletTheme";

interface WalletAvatarProps {
  address?: string;
  size?: number;
  className?: string;
}

const FACE_TONES = ["#FFE0CC", "#FBD5D5", "#FDE2E4", "#E0F2FE", "#DCFCE7", "#F5E0FF"];
const COAT_SHADES = ["#0F172A", "#111827", "#0B1F3A"];
const VISOR_SHADES = ["#ECFEFF", "#F5F3FF", "#F1F5F9"];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const WalletAvatar = ({ address, size = 40, className }: WalletAvatarProps) => {
  const theme = useMemo(() => getWalletTheme(address), [address]);

  const features = useMemo(() => {
    const face = FACE_TONES[theme.hash % FACE_TONES.length];
    const coat = COAT_SHADES[theme.hash % COAT_SHADES.length];
    const visor = VISOR_SHADES[theme.hash % VISOR_SHADES.length];
    const hasVisor = (theme.hash & 0b1) === 0;
    const browLevel = 44 + (theme.hash % 6);
    const smileCurve = ((theme.hash >> 3) % 5) - 2;
    const badgeSide = (theme.hash >> 4) % 2 === 0 ? "left" : "right";
    const accentGlow = 0.25 + ((theme.hash >> 5) % 5) * 0.15;
    return { face, coat, visor, hasVisor, browLevel, smileCurve, badgeSide, accentGlow };
  }, [theme.hash]);

  const pixelRatio = size / 120;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full border border-white/20 bg-slate-950/40 ${
        className ?? ""
      }`.trim()}
      style={{
        width: size,
        height: size,
        boxShadow: `0 10px 20px rgba(15, 23, 42, 0.35)`,
      }}
      aria-label="Wallet-bound avatar"
    >
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${theme.gradient}`} />
      <div className="relative h-full w-full p-[8%]">
        <svg
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-hidden="true"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <clipPath id="avatar-clip">
              <circle cx="60" cy="60" r="52" />
            </clipPath>
            <filter id="avatar-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={clamp(features.accentGlow * pixelRatio * 18, 4, 14)} />
            </filter>
          </defs>

          <g clipPath="url(#avatar-clip)">
            <circle cx="60" cy="60" r="52" fill="rgba(15,23,42,0.4)" />
            <circle cx="60" cy="34" r="30" fill={theme.accent} opacity={0.15} />
            <circle cx="60" cy="35" r="28" fill={features.face} />

            <path
              d={`M30 ${features.browLevel} Q 60 ${features.browLevel - 8}, 90 ${
                features.browLevel
              }`}
              stroke={theme.accentMuted}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
              opacity={0.8}
            />

            {features.hasVisor ? (
              <path
                d="M38 42 Q 60 35, 82 42 Q 78 58, 42 58 Z"
                fill={features.visor}
                stroke="rgba(15,23,42,0.25)"
                strokeWidth={1.5}
              />
            ) : (
              <>
                <circle cx="46" cy="48" r="5" fill="#0f172a" />
                <circle cx="74" cy="48" r="5" fill="#0f172a" />
              </>
            )}

            <path
              d={`M45 ${70 + features.smileCurve} Q 60 ${78 + features.smileCurve}, 75 ${
                70 + features.smileCurve
              }`}
              stroke="#0f172a"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              opacity={0.85}
            />

            <path
              d="M26 105 Q 60 80, 94 105"
              fill={features.coat}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
            />
            <path
              d="M47 82 Q 60 95, 73 82"
              stroke={theme.accent}
              strokeWidth={4}
              strokeLinecap="round"
            />

            <circle
              cx={features.badgeSide === "left" ? 40 : 80}
              cy="94"
              r="6"
              fill={theme.accent}
              opacity={0.85}
              filter="url(#avatar-glow)"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default WalletAvatar;
