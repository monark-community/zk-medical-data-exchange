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

const HEAD_SHAPE_CONFIG = {
  circle: { borderRadius: "50%" },
  squircle: { borderRadius: "45% / 50%" },
  roundedSquare: { borderRadius: "35%" },
  oval: { borderRadius: "40% / 60%" },
};

const BASE_SIZE = 72;

type EarVariant = "bunny" | "cat" | "antenna" | "dog" | "mouse" | "fox" | "bear";
type EyeVariant = "dot" | "arc" | "spark" | "star";
type ExpressionVariant = "smile" | "laugh" | "calm" | "wow" | "grin" | "frown";
type HeadShape = "circle" | "squircle" | "roundedSquare" | "oval";
type BodyPattern = "plain" | "stripes" | "sash" | "signals" | "dots" | "checks";
type CollarVariant = "round" | "v" | "tech" | "bow" | "chain";
type CheekStyle = "solid" | "ring" | "blush";
type GlassesVariant = "none" | "round" | "square" | "aviator" | "cat-eye";
type NoseVariant = "pointy" | "none" | "button";

interface AvatarFeatures {
  face: string;
  body: string;
  earVariant: EarVariant;
  accessoryVariant: "badge" | "visor" | "stethoscope" | "hat" | "bowtie";
  eyeVariant: EyeVariant;
  expressionVariant: ExpressionVariant;
  hasFreckles: boolean;
  headShape: HeadShape;
  bodyPattern: BodyPattern;
  collarVariant: CollarVariant;
  cheekStyle: CheekStyle;
  blinkDelay: number;
  bobDuration: number;
  cheekTone: string;
  sparkleDelay: number;
  glassesVariant: GlassesVariant;
  noseVariant: NoseVariant;
}

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

const generateFeatures = (hash: number, accent: string): AvatarFeatures => {
  const getIndex = (shift: number, mod: number) => Math.abs((hash >> shift) % mod);

  const face = FACE_TONES[hash % FACE_TONES.length];
  const body = BODY_TONES[hash % BODY_TONES.length];
  const earVariant: EarVariant = (
    ["dog", "cat", "fox", "bunny", "antenna", "bear", "mouse"] as const
  )[getIndex(0, 7)];
  const accessoryVariant: "badge" | "visor" | "stethoscope" | "hat" | "bowtie" = (
    ["badge", "bowtie", "visor", "stethoscope", "hat"] as const
  )[getIndex(2, 5)];
  const eyeVariant: EyeVariant = (["dot", "star", "spark", "arc"] as const)[getIndex(6, 4)];
  const expressionVariant: ExpressionVariant = (() => {
    const happy = ["smile", "grin", "laugh"] as const;
    const neutral = ["calm", "wow", "frown"] as const;
    return getIndex(8, 10) < 7
      ? happy[getIndex(8, happy.length)]
      : neutral[getIndex(8, neutral.length)];
  })();
  const hasFreckles = ((hash >> 7) & 1) === 0;
  const headShape: HeadShape = (["squircle", "roundedSquare", "circle", "oval"] as const)[
    getIndex(11, 4)
  ];
  const bodyPattern: BodyPattern = (
    ["plain", "signals", "stripes", "checks", "sash", "dots"] as const
  )[getIndex(12, 6)];
  const collarVariant: CollarVariant = (["tech", "round", "chain", "bow", "v"] as const)[
    getIndex(14, 5)
  ];
  const cheekStyle: CheekStyle =
    getIndex(16, 10) < 6 ? "blush" : (["ring", "solid"] as const)[getIndex(16, 2)];
  const blinkDelay = 2 + (hash % 3);
  const bobDuration = 3.5 + (hash % 35) / 10;
  const cheekTone = `${accent}55`;
  const sparkleDelay = (hash % 5) * 0.4;
  const glassesVariant: GlassesVariant = (
    ["none", "square", "round", "aviator", "cat-eye"] as const
  )[getIndex(17, 5)];
  const noseVariant: NoseVariant = (["button", "pointy", "none"] as const)[getIndex(18, 3)];

  return {
    face,
    body,
    earVariant,
    accessoryVariant,
    eyeVariant,
    expressionVariant,
    hasFreckles,
    headShape,
    bodyPattern,
    collarVariant,
    cheekStyle,
    blinkDelay,
    bobDuration,
    cheekTone,
    sparkleDelay,
    glassesVariant,
    noseVariant,
  };
};

interface ComponentProps {
  features: AvatarFeatures;
  theme?: any;
  blinkStyleLeft?: any;
  blinkStyleRight?: any;
  earColor?: string;
}

const Eyes = ({ features, theme, blinkStyleLeft, blinkStyleRight }: ComponentProps) => (
  <>
    {renderEye("left", features, theme, blinkStyleLeft)}
    {renderEye("right", features, theme, blinkStyleRight)}
  </>
);

const renderEye = (
  side: "left" | "right",
  features: AvatarFeatures,
  theme: any,
  blinkStyle: any
) => {
  const positionClass = side === "left" ? "left-3" : "right-3";
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

const Mouth = ({ features, theme }: ComponentProps) => {
  switch (features.expressionVariant) {
    case "laugh":
      return (
        <span
          className="absolute left-1/2 top-10 flex h-3 w-5 -translate-x-1/2 items-center justify-center rounded-b-full border-b-2 border-slate-900 bg-white/70"
          style={{
            color: theme.accent,
            boxShadow: `0 0 8px ${theme.accent}80`,
            animation: "wallet-avatar-hover 2s ease-in-out infinite",
          }}
        >
          <span className="h-2 w-4 rounded-b-full bg-slate-900/20" />
          <span
            className="absolute -top-1 -right-1 h-1 w-1 rounded-full bg-yellow-300"
            style={{ boxShadow: `0 0 4px ${theme.accent}` }}
          />
          <span
            className="absolute -top-1 -left-1 h-0.5 w-0.5 rounded-full bg-yellow-300"
            style={{ boxShadow: `0 0 3px ${theme.accent}` }}
          />
        </span>
      );
    case "calm":
      return (
        <span
          className="absolute left-1/2 top-10 h-1 w-4 -translate-x-1/2 rounded-full bg-slate-900/70"
          style={{ opacity: 0.85 }}
        />
      );
    case "wow":
      return (
        <span
          className="absolute left-1/2 top-[34px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-slate-900/80"
          style={{ backgroundColor: "#fff", opacity: 0.9 }}
        />
      );
    default:
      return (
        <span
          className="absolute left-1/2 top-10 h-1.5 w-6 -translate-x-1/2 rounded-full bg-slate-900"
          style={{
            boxShadow: `0 0 6px ${theme.accent}60`,
            borderRadius: "50% 50% 80% 80%",
            transform: "rotate(2deg)",
          }}
        />
      );
  }
};

const Cheeks = ({ features }: ComponentProps) => (
  <>
    {renderCheek("left", features)}
    {renderCheek("right", features)}
  </>
);

const renderCheek = (side: "left" | "right", features: AvatarFeatures) => {
  const className = side === "left" ? "left-2" : "right-2";
  if (features.cheekStyle === "ring") {
    return (
      <span
        className={`absolute ${className} top-6 h-2 w-2 rounded-full border border-white/50`}
        style={{ boxShadow: `0 0 6px ${features.cheekTone}40` }}
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

const Glasses = ({ features }: ComponentProps) => {
  if (features.glassesVariant === "none") return null;
  const baseClass = "absolute border border-slate-900/50";
  const eyeTop = features.eyeVariant === "arc" ? 22 : 20;
  const glassesTop = eyeTop - 4;
  const bridgeTop = glassesTop + 4;

  const renderLenses = () => {
    switch (features.glassesVariant) {
      case "round":
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
          </>
        );
      case "square":
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
          </>
        );
      case "aviator":
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
          </>
        );
      case "cat-eye":
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
          </>
        );
    }
  };

  return (
    <>
      {renderLenses()}
      <span
        className="absolute left-1/2 w-2 h-0.5 -translate-x-1/2 bg-slate-900/50"
        style={{ top: `${bridgeTop}px` }}
      />
    </>
  );
};

const Nose = ({ features }: ComponentProps) => {
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

const BodyPatternComponent = ({ features, theme }: ComponentProps) => {
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

const Collar = ({ features, theme }: ComponentProps) => {
  switch (features.collarVariant) {
    case "round":
      return (
        <span
          className="absolute -top-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full border border-white/20 bg-white/10"
          style={{ boxShadow: `0 4px 8px ${theme.accent}30` }}
        />
      );
    case "v":
      return (
        <span className="absolute -top-1 flex items-center justify-center text-[10px] text-white/70">
          <span className="h-2 w-8 border-b border-white/40" />
        </span>
      );
    case "bow":
      return (
        <span className="absolute -top-1 flex items-center justify-center gap-1">
          <span className="h-2 w-3 rounded-full bg-pink-400" />
          <span className="h-2 w-3 rounded-full bg-pink-400" />
        </span>
      );
    case "chain":
      return (
        <span className="absolute -top-1 flex items-center justify-center text-[8px] text-slate-400">
          ◇—◇—◇
        </span>
      );
    default:
      return (
        <span
          className="absolute -top-1 flex w-full items-center justify-center gap-2 text-[8px] uppercase tracking-widest text-white/60"
          style={{ letterSpacing: "0.15em" }}
        >
          ▢ ▢ ▢
        </span>
      );
  }
};

const Ears = ({ features, earColor }: ComponentProps) => {
  switch (features.earVariant) {
    case "mouse":
      return (
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
      );
    case "fox":
      return (
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
      );
    case "bear":
      return (
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
      );
    case "cat":
      return (
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
      );
    case "antenna":
      return (
        <>
          <span
            className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-[120%] rounded-full"
            style={{ backgroundColor: earColor, opacity: 0.8 }}
          >
            <span
              className="absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: "#fff" }}
            />
          </span>
          <span
            className="absolute -top-2 left-1/2 h-2 w-2 translate-x-[20%] rounded-full"
            style={{ backgroundColor: earColor, opacity: 0.8 }}
          >
            <span
              className="absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: "#fff" }}
            />
          </span>
        </>
      );
    default:
      return null;
  }
};

const Accessory = ({ features, theme }: ComponentProps) => {
  switch (features.accessoryVariant) {
    case "badge":
      return (
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }}
        />
      );
    case "visor":
      return (
        <span
          className="h-2 w-10 rounded-full"
          style={{ backgroundColor: theme.accentMuted, opacity: 0.8 }}
        />
      );
    case "stethoscope":
      return (
        <span
          className="relative flex items-center gap-1 text-[10px]"
          style={{ color: theme.accent }}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="h-4 w-[2px] rounded-full bg-current" />
          <span className="h-2 w-2 rounded-full border border-current" />
        </span>
      );
    case "hat":
      return (
        <span className="absolute -top-2 left-1/2 h-2 w-6 -translate-x-1/2 rounded-full bg-blue-500" />
      );
    case "bowtie":
      return <span className="flex items-center justify-center text-[8px] text-red-400">⋈</span>;
    default:
      return null;
  }
};

const WalletAvatar = ({ address, size = 40, className }: WalletAvatarProps) => {
  const theme = useMemo(() => getWalletTheme(address), [address]);
  const features = useMemo(
    () => generateFeatures(theme.hash, theme.accent),
    [theme.hash, theme.accent]
  );

  const scale = size / BASE_SIZE;
  const earColor = theme.accentMuted;

  const isHappy = ["smile", "grin", "laugh"].includes(features.expressionVariant);
  const characterStyle = {
    animation: `wallet-avatar-bob ${features.bobDuration}s ease-in-out infinite`,
    transform: isHappy ? "scale(1.02)" : "scale(1)",
  };

  const sparkleStyle = {
    animation: `wallet-avatar-hover ${isHappy ? 2.5 : 3.2}s ease-in-out infinite`,
    animationDelay: `${features.sparkleDelay}s`,
    opacity: isHappy ? 0.8 : 0.6,
  };

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
              <div
                className="relative h-14 w-14 border border-white/20"
                style={{
                  backgroundColor: features.face,
                  boxShadow: "0 6px 12px rgba(15, 23, 42, 0.25)",
                  overflow: "visible",
                  ...HEAD_SHAPE_CONFIG[features.headShape],
                }}
              >
                <Cheeks features={features} />
                {features.hasFreckles && (
                  <>
                    <span className="absolute left-4 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                    <span className="absolute left-5 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                    <span className="absolute right-5 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                    <span className="absolute right-4 top-7 h-0.5 w-0.5 rounded-full bg-amber-400/70" />
                  </>
                )}
                <Eyes
                  features={features}
                  theme={theme}
                  blinkStyleLeft={blinkStyleLeft}
                  blinkStyleRight={blinkStyleRight}
                />
                <Glasses features={features} />
                <Nose features={features} />
                <Mouth features={features} theme={theme} />
              </div>
              <Ears features={features} earColor={earColor} />
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
              <BodyPatternComponent features={features} theme={theme} />
              <Collar features={features} theme={theme} />
              <Accessory features={features} theme={theme} />
              {/* Arms */}
              <span
                className="absolute left-[-6px] top-1/2 h-3 w-4 -translate-y-1/2 rounded-full border border-white/10"
                style={{
                  backgroundColor: features.body,
                  boxShadow: `0 2px 4px ${theme.accent}20`,
                  opacity: 0.9,
                }}
              />
              <span
                className="absolute right-[-6px] top-1/2 h-3 w-4 -translate-y-1/2 rounded-full border border-white/10"
                style={{
                  backgroundColor: features.body,
                  boxShadow: `0 2px 4px ${theme.accent}20`,
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletAvatar;
