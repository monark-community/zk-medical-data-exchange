"use client";

import { useMemo } from "react";
import { getWalletTheme } from "@/lib/walletTheme";

interface WalletAvatarProps {
  address?: string;
  size?: number;
  className?: string;
}

const FACE_TONES = ["#F5E0FF", "#DCFCE7", "#E0F2FE", "#FDE2E4", "#FBD5D5", "#FFE0CC"];
const BODY_TONES = ["#132D46", "#0B1F3A", "#111827", "#0F172A"];

type EarVariant = "bunny" | "cat" | "antenna" | "dog" | "mouse" | "fox" | "bear";
type EyeVariant = "dot" | "arc" | "spark" | "star";
type ExpressionVariant = "smile" | "laugh" | "calm" | "wow" | "grin" | "frown";
type PetVariant = "spark" | "pill" | "shield" | "heart";
type HeadShape = "circle" | "squircle" | "roundedSquare" | "oval";
type BodyPattern = "plain" | "stripes" | "sash" | "signals" | "dots" | "checks";
type CollarVariant = "round" | "v" | "tech" | "bow" | "chain";
type CheekStyle = "solid" | "ring" | "blush";
type ForeheadMark = "none" | "dot" | "bar";
type GlassesVariant = "none" | "round" | "square" | "aviator" | "cat-eye";
type NoseVariant = "pointy" | "none" | "button";

const HEAD_SHAPE_CONFIG = {
  circle: { borderRadius: "50%" },
  squircle: { borderRadius: "45% / 50%" },
  roundedSquare: { borderRadius: "35%" },
  oval: { borderRadius: "40% / 60%" },
};

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

    @keyframes wallet-avatar-orbit {
      0% { transform: rotate(0deg) translateX(6px) rotate(0deg); }
      50% { transform: rotate(180deg) translateX(6px) rotate(-180deg); }
      100% { transform: rotate(360deg) translateX(6px) rotate(-360deg); }
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
    const earVariant = ["dog", "cat", "fox", "bunny", "antenna", "bear", "mouse"][
      hash % 7
    ] as EarVariant;
    const accessoryVariant = ["badge", "bowtie", "visor", "stethoscope", "hat"][
      Math.abs((hash >> 2) % 5)
    ] as "badge" | "visor" | "stethoscope" | "hat" | "bowtie";
    const eyeVariant = ["dot", "star", "spark", "arc"][Math.abs((hash >> 6) % 4)] as EyeVariant;
    const expressionVariant = ["frown", "wow", "calm", "grin", "laugh", "smile"][
      Math.abs((hash >> 8) % 6)
    ] as ExpressionVariant;
    const hasFreckles = ((hash >> 7) & 1) === 0;
    const petVariant = ["pill", "spark", "heart", "shield"][
      Math.abs((hash >> 9) % 4)
    ] as PetVariant;
    const petSide = (hash & 1) === 0 ? -1 : 1;
    const petDelay = (hash % 6) * 0.2;
    const headShape = ["squircle", "roundedSquare", "circle", "oval"][
      Math.abs((hash >> 11) % 4)
    ] as HeadShape;
    const bodyPattern = ["plain", "signals", "stripes", "checks", "sash", "dots"][
      Math.abs((hash >> 12) % 6)
    ] as BodyPattern;
    const collarVariant = ["tech", "round", "chain", "bow", "v"][
      Math.abs((hash >> 14) % 5)
    ] as CollarVariant;
    const cheekStyle = ["ring", "blush", "solid"][Math.abs((hash >> 16) % 3)] as CheekStyle;
    const foreheadMark = ["none", "bar", "dot"][Math.abs((hash >> 15) % 3)] as ForeheadMark;
    const blinkDelay = 2 + (hash % 3);
    const bobDuration = 3.5 + (hash % 35) / 10;
    const cheekTone = `${theme.accent}55`;
    const sparkleDelay = (hash % 5) * 0.4;
    const glassesVariant = ["none", "square", "round", "aviator", "cat-eye"][
      Math.abs((hash >> 17) % 5)
    ] as GlassesVariant;
    const noseVariant = ["button", "pointy", "none"][Math.abs((hash >> 18) % 3)] as NoseVariant;
    return {
      face,
      body,
      earVariant,
      accessoryVariant,
      eyeVariant,
      expressionVariant,
      hasFreckles,
      petVariant,
      petSide,
      petDelay,
      headShape,
      bodyPattern,
      collarVariant,
      cheekStyle,
      foreheadMark,
      blinkDelay,
      bobDuration,
      cheekTone,
      sparkleDelay,
      glassesVariant,
      noseVariant,
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

  const renderEye = (side: "left" | "right") => {
    const positionClass = side === "left" ? "left-3" : "right-3";
    const blinkStyle = side === "left" ? blinkStyleLeft : blinkStyleRight;
    if (features.eyeVariant === "arc") {
      return (
        <span
          className={`absolute ${positionClass} top-[22px] h-1.5 w-3 rounded-full border-b-2 border-slate-900`}
          style={{
            animation: "wallet-avatar-blink 3.5s ease-in-out infinite",
            transformOrigin: "center",
            ...blinkStyle,
          }}
        />
      );
    }
    if (features.eyeVariant === "spark") {
      return (
        <span
          className={`absolute ${positionClass} top-[20px] flex h-2 w-2 rotate-45 items-center justify-center rounded-[2px] bg-white/80`}
          style={{
            boxShadow: `0 0 6px ${theme.accent}`,
            animation: `wallet-avatar-hover 2.8s ease-in-out infinite`,
            ...blinkStyle,
          }}
        />
      );
    }
    return (
      <span
        className={`absolute ${positionClass} top-5 h-2 w-2 rounded-full bg-slate-900`}
        style={{
          animation: "wallet-avatar-blink 3.5s ease-in-out infinite",
          ...blinkStyle,
        }}
      />
    );
  };

  const mouthElement = (() => {
    switch (features.expressionVariant) {
      case "laugh":
        return (
          <span
            className="absolute left-1/2 top-8 flex h-3 w-5 -translate-x-1/2 items-center justify-center rounded-b-full border-b-2 border-slate-900 bg-white/70"
            style={{ color: theme.accent }}
          >
            <span className="h-2 w-4 rounded-b-full bg-slate-900/20" />
          </span>
        );
      case "calm":
        return (
          <span
            className="absolute left-1/2 top-8 h-1 w-4 -translate-x-1/2 rounded-full bg-slate-900/70"
            style={{ opacity: 0.85 }}
          />
        );
      case "wow":
        return (
          <span
            className="absolute left-1/2 top-[30px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-slate-900/80"
            style={{ backgroundColor: "#fff", opacity: 0.9 }}
          />
        );
      default:
        return (
          <span
            className="absolute left-1/2 top-8 h-1 w-5 -translate-x-1/2 rounded-full bg-slate-900"
            style={{ boxShadow: `0 0 4px ${theme.accent}40` }}
          />
        );
    }
  })();

  const renderCheek = (side: "left" | "right") => {
    const className = side === "left" ? "left-2" : "right-2";
    if (features.cheekStyle === "ring") {
      return (
        <span
          className={`absolute ${className} top-6 h-2 w-2 rounded-full border border-white/50`}
          style={{ boxShadow: `0 0 6px ${theme.accent}40` }}
        />
      );
    }
    if (features.cheekStyle === "blush") {
      return (
        <span
          className={`absolute ${className} top-6 h-2 w-3 rounded-full`}
          style={{ backgroundColor: "#ff9999", opacity: 0.8 }}
        />
      );
    }
    return (
      <span
        className={`absolute ${className} top-6 h-1.5 w-3 rounded-full`}
        style={{ backgroundColor: features.cheekTone }}
      />
    );
  };

  const renderGlasses = () => {
    if (features.glassesVariant === "none") return null;
    const baseClass = "absolute border border-slate-900/50";
    const eyeTop = features.eyeVariant === "arc" ? 22 : 20;
    const glassesTop = eyeTop - 4; // 4px above eyes
    const bridgeTop = glassesTop + 4; // 4px below glasses
    if (features.glassesVariant === "round") {
      return (
        <>
          <span
            className={`${baseClass} left-2 h-3 w-3 rounded-full`}
            style={{ top: `${glassesTop}px` }}
          />
          <span
            className={`${baseClass} right-2 h-3 w-3 rounded-full`}
            style={{ top: `${glassesTop}px` }}
          />
          <span
            className="absolute left-1/2 w-2 h-0.5 -translate-x-1/2 bg-slate-900/50"
            style={{ top: `${bridgeTop}px` }}
          />
        </>
      );
    }
    if (features.glassesVariant === "square") {
      return (
        <>
          <span
            className={`${baseClass} left-2 h-3 w-3 rounded`}
            style={{ top: `${glassesTop}px` }}
          />
          <span
            className={`${baseClass} right-2 h-3 w-3 rounded`}
            style={{ top: `${glassesTop}px` }}
          />
          <span
            className="absolute left-1/2 w-2 h-0.5 -translate-x-1/2 bg-slate-900/50"
            style={{ top: `${bridgeTop}px` }}
          />
        </>
      );
    }
    if (features.glassesVariant === "aviator") {
      return (
        <>
          <span
            className={`${baseClass} left-1.5 h-3 w-4 rounded-full`}
            style={{ top: `${glassesTop}px`, borderRadius: "50% 50% 50% 20%" }}
          />
          <span
            className={`${baseClass} right-1.5 h-3 w-4 rounded-full`}
            style={{ top: `${glassesTop}px`, borderRadius: "50% 50% 20% 50%" }}
          />
          <span
            className="absolute left-1/2 w-3 h-0.5 -translate-x-1/2 bg-slate-900/50"
            style={{ top: `${bridgeTop}px` }}
          />
        </>
      );
    }
    if (features.glassesVariant === "cat-eye") {
      return (
        <>
          <span
            className={`${baseClass} left-2 h-3 w-4`}
            style={{ top: `${glassesTop}px`, borderRadius: "50% 10% 50% 50%" }}
          />
          <span
            className={`${baseClass} right-2 h-3 w-4`}
            style={{ top: `${glassesTop}px`, borderRadius: "10% 50% 50% 50%" }}
          />
          <span
            className="absolute left-1/2 w-2 h-0.5 -translate-x-1/2 bg-slate-900/50"
            style={{ top: `${bridgeTop}px` }}
          />
        </>
      );
    }
  };

  const renderNose = () => {
    if (features.noseVariant === "none") return null;
    if (features.noseVariant === "button") {
      return (
        <span
          className="absolute left-1/2 top-8 h-1 w-1 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "#000", opacity: 0.7 }}
        />
      );
    }
    return (
      <span
        className="absolute left-1/2 top-8 h-1.5 w-0.5 -translate-x-1/2"
        style={{
          backgroundColor: "#000",
          opacity: 0.7,
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }}
      />
    );
  };

  const renderBodyPattern = () => {
    if (features.bodyPattern === "plain") return null;
    if (features.bodyPattern === "stripes") {
      return (
        <span
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `linear-gradient(135deg, transparent 40%, ${theme.accentMuted} 40%, ${theme.accentMuted} 60%, transparent 60%)`,
            backgroundSize: "12px 12px",
          }}
        />
      );
    }
    if (features.bodyPattern === "sash") {
      return (
        <span
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `linear-gradient(120deg, transparent 45%, ${theme.accent} 45%, ${theme.accentMuted} 60%, transparent 60%)`,
          }}
        />
      );
    }
    if (features.bodyPattern === "dots") {
      return (
        <span
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `radial-gradient(circle, ${theme.accentMuted} 1px, transparent 1px)`,
            backgroundSize: "6px 6px",
          }}
        />
      );
    }
    if (features.bodyPattern === "checks") {
      return (
        <span
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(90deg, ${theme.accentMuted} 1px, transparent 1px), linear-gradient(${theme.accentMuted} 1px, transparent 1px)`,
            backgroundSize: "8px 8px",
          }}
        />
      );
    }
    return (
      <span className="absolute inset-0 flex items-center justify-around text-[8px] text-white/50">
        <span>●●●</span>
        <span>◦◦◦</span>
      </span>
    );
  };

  const renderCollar = () => {
    if (features.collarVariant === "round") {
      return (
        <span
          className="absolute -top-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full border border-white/20 bg-white/10"
          style={{ boxShadow: `0 4px 8px ${theme.accent}30` }}
        />
      );
    }
    if (features.collarVariant === "v") {
      return (
        <span className="absolute -top-1 flex items-center justify-center text-[10px] text-white/70">
          <span className="h-2 w-8 border-b border-white/40" />
        </span>
      );
    }
    if (features.collarVariant === "bow") {
      return (
        <span className="absolute -top-1 flex items-center justify-center gap-1">
          <span className="h-2 w-3 rounded-full bg-pink-400" />
          <span className="h-2 w-3 rounded-full bg-pink-400" />
        </span>
      );
    }
    if (features.collarVariant === "chain") {
      return (
        <span className="absolute -top-1 flex items-center justify-center text-[8px] text-slate-400">
          ◇—◇—◇
        </span>
      );
    }
    return (
      <span
        className="absolute -top-1 flex w-full items-center justify-center gap-2 text-[8px] uppercase tracking-widest text-white/60"
        style={{ letterSpacing: "0.15em" }}
      >
        ▢ ▢ ▢
      </span>
    );
  };

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
              {features.earVariant === "mouse" && (
                <>
                  <span
                    className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-[120%] rounded-full"
                    style={{ backgroundColor: earColor, opacity: 0.9 }}
                  />
                  <span
                    className="absolute -top-3 left-1/2 h-4 w-4 translate-x-[20%] rounded-full"
                    style={{ backgroundColor: earColor }}
                  />
                </>
              )}
              {features.earVariant === "fox" && (
                <>
                  <span
                    className="absolute -top-1 left-1/2 h-4 w-5 -translate-x-[110%] rotate-[-15deg] rounded-tl-[90%] rounded-tr-[5%]"
                    style={{ backgroundColor: earColor }}
                  />
                  <span
                    className="absolute -top-1 left-1/2 h-4 w-5 translate-x-[10%] rotate-[15deg] rounded-tr-[90%] rounded-tl-[5%]"
                    style={{ backgroundColor: earColor }}
                  />
                </>
              )}
              {features.earVariant === "bear" && (
                <>
                  <span
                    className="absolute -top-2 left-1/2 h-3 w-4 -translate-x-[110%] rounded-full"
                    style={{ backgroundColor: earColor, opacity: 0.9 }}
                  />
                  <span
                    className="absolute -top-2 left-1/2 h-3 w-4 translate-x-[10%] rounded-full"
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
                    className="absolute -top-2 left-1/2 h-2 w-1 -translate-x-[90%] rounded-full"
                    style={{ backgroundColor: earColor, opacity: 0.8 }}
                  >
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#fff" }}
                    />
                  </span>
                  <span
                    className="absolute -top-2 left-1/2 h-2 w-1 translate-x-[10%] rounded-full"
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
                className="relative h-14 w-14 border border-white/20"
                style={{
                  backgroundColor: features.face,
                  boxShadow: "0 6px 12px rgba(15, 23, 42, 0.25)",
                  overflow: "hidden",
                  ...HEAD_SHAPE_CONFIG[features.headShape],
                }}
              >
                {renderCheek("left")}
                {renderCheek("right")}
                {features.hasFreckles && (
                  <>
                    <span className="absolute left-4 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                    <span className="absolute left-5 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                    <span className="absolute right-5 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                    <span className="absolute right-4 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                  </>
                )}
                {renderEye("left")}
                {renderEye("right")}
                {renderGlasses()}
                {renderNose()}
                {mouthElement}
              </div>
            </div>

            <div
              className="mt-1 flex h-10 w-14 items-center justify-center rounded-3xl border border-white/10 px-2"
              style={{
                backgroundColor: features.body,
                boxShadow: `0 6px 14px ${theme.accent}40`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {renderBodyPattern()}
              {renderCollar()}
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
              {features.accessoryVariant === "hat" && (
                <span className="absolute -top-2 left-1/2 h-2 w-6 -translate-x-1/2 rounded-full bg-blue-500" />
              )}
              {features.accessoryVariant === "bowtie" && (
                <span className="flex items-center justify-center text-[8px] text-red-400">⋈</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletAvatar;
