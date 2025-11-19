"use client";

import { useMemo } from "react";
import { getWalletTheme } from "@/lib/walletTheme";

interface WalletAvatarProps {
  address?: string;
  size?: number;
  className?: string;
}

const FACE_TONES = ["#FFE0CC", "#FBD5D5", "#FDE2E4", "#E0F2FE", "#DCFCE7", "#F5E0FF"];
const BODY_TONES = ["#0F172A", "#111827", "#0B1F3A", "#132D46"];

const styleId = "wallet-avatar-animations";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    @keyframes wallet-avatar-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4%); }
    }

    @keyframes wallet-avatar-blink {
      0%, 46%, 48%, 100% { transform: scaleY(1); }
      47% { transform: scaleY(0.1); }
    }

    @keyframes wallet-avatar-hover {
      0% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-2px) scale(1.02); }
      100% { transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);
}

const BASE_SIZE = 72;

const WalletAvatar = ({ address, size = 40, className }: WalletAvatarProps) => {
  const theme = useMemo(() => getWalletTheme(address), [address]);

  const features = useMemo(() => {
    const hash = theme.hash;
    const face = FACE_TONES[hash % FACE_TONES.length];
    const body = BODY_TONES[hash % BODY_TONES.length];
    const earVariant = ["bunny", "cat", "antenna"][hash % 3] as "bunny" | "cat" | "antenna";
    const accessoryVariant = ["badge", "visor", "stethoscope"][Math.abs((hash >> 2) % 3)] as
      | "badge"
      | "visor"
      | "stethoscope";
    const blinkDelay = 2 + (hash % 3);
    const bobDuration = 3.5 + (hash % 35) / 10;
    const cheekTone = `${theme.accent}55`;
    const sparkleDelay = (hash % 5) * 0.4;
    return {
      face,
      body,
      earVariant,
      accessoryVariant,
      blinkDelay,
      bobDuration,
      cheekTone,
      sparkleDelay,
    };
  }, [theme.hash, theme.accent]);

  const earColor = theme.accentMuted;

  const scale = size / BASE_SIZE;

  const characterStyle = {
    animation: `wallet-avatar-bob ${features.bobDuration}s ease-in-out infinite`,
  } as const;

  const sparkleStyle = {
    animation: `wallet-avatar-hover ${3.2 + features.sparkleDelay / 2}s ease-in-out infinite`,
    animationDelay: `${features.sparkleDelay}s`,
  } as const;

  const blinkStyleLeft = { animationDelay: `${features.blinkDelay}s` };
  const blinkStyleRight = { animationDelay: `${features.blinkDelay + 0.8}s` };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full border border-white/15 bg-slate-950/40 ${
        className ?? ""
      }`.trim()}
      style={{
        width: size,
        height: size,
        boxShadow: "0 10px 20px rgba(15, 23, 42, 0.35)",
        overflow: "visible",
      }}
      aria-label="Wallet character avatar"
    >
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${theme.gradient}`} />
      <div className="relative flex h-full w-full items-center justify-center overflow-visible">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: BASE_SIZE,
            height: BASE_SIZE,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div
            className="absolute inset-[15%] rounded-full bg-black/20 blur-xl"
            style={sparkleStyle}
          />
          <div
            className="relative flex h-full w-full flex-col items-center justify-end"
            style={characterStyle}
          >
            <div className="relative">
              {features.earVariant === "bunny" && (
                <>
                  <span
                    className="absolute -top-7 left-1/2 h-9 w-4 -translate-x-[110%] rounded-full"
                    style={{ backgroundColor: earColor, opacity: 0.9 }}
                  />
                  <span
                    className="absolute -top-7 left-1/2 h-9 w-4 translate-x-[10%] rounded-full"
                    style={{ backgroundColor: earColor }}
                  />
                </>
              )}
              {features.earVariant === "cat" && (
                <>
                  <span
                    className="absolute -top-1 left-1/2 h-4 w-5 -translate-x-[110%] rotate-[-12deg] rounded-tl-[80%] rounded-tr-[10%]"
                    style={{ backgroundColor: earColor }}
                  />
                  <span
                    className="absolute -top-1 left-1/2 h-4 w-5 translate-x-[10%] rotate-[12deg] rounded-tr-[80%] rounded-tl-[10%]"
                    style={{ backgroundColor: earColor }}
                  />
                </>
              )}
              {features.earVariant === "antenna" && (
                <>
                  <span
                    className="absolute -top-5 left-1/2 h-5 w-1 -translate-x-[90%] rounded-full"
                    style={{ backgroundColor: earColor, opacity: 0.8 }}
                  >
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#fff" }}
                    />
                  </span>
                  <span
                    className="absolute -top-5 left-1/2 h-5 w-1 translate-x-[10%] rounded-full"
                    style={{ backgroundColor: earColor, opacity: 0.8 }}
                  >
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#fff" }}
                    />
                  </span>
                </>
              )}

              <div
                className="relative h-14 w-14 rounded-full border border-white/20"
                style={{
                  backgroundColor: features.face,
                  boxShadow: "0 6px 12px rgba(15, 23, 42, 0.25)",
                }}
              >
                <span
                  className="absolute left-2 top-6 h-1.5 w-3 rounded-full"
                  style={{ backgroundColor: features.cheekTone }}
                />
                <span
                  className="absolute right-2 top-6 h-1.5 w-3 rounded-full"
                  style={{ backgroundColor: features.cheekTone }}
                />
                <span
                  className="absolute left-3 top-5 h-2 w-2 rounded-full bg-slate-900"
                  style={{
                    animation: "wallet-avatar-blink 3.5s ease-in-out infinite",
                    ...blinkStyleLeft,
                  }}
                />
                <span
                  className="absolute right-3 top-5 h-2 w-2 rounded-full bg-slate-900"
                  style={{
                    animation: "wallet-avatar-blink 3.5s ease-in-out infinite",
                    ...blinkStyleRight,
                  }}
                />
                <span className="absolute left-1/2 top-8 h-1 w-5 -translate-x-1/2 rounded-full bg-slate-900" />
              </div>
            </div>

            <div
              className="mt-1 flex h-10 w-14 items-center justify-center rounded-3xl border border-white/10 px-2"
              style={{ backgroundColor: features.body, boxShadow: `0 6px 14px ${theme.accent}40` }}
            >
              {features.accessoryVariant === "badge" && (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }}
                />
              )}
              {features.accessoryVariant === "visor" && (
                <span
                  className="h-2 w-10 rounded-full"
                  style={{ backgroundColor: theme.accentMuted, opacity: 0.8 }}
                />
              )}
              {features.accessoryVariant === "stethoscope" && (
                <span
                  className="relative flex items-center gap-1 text-[10px]"
                  style={{ color: theme.accent }}
                >
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-4 w-[2px] rounded-full bg-current" />
                  <span className="h-2 w-2 rounded-full border border-current" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletAvatar;
