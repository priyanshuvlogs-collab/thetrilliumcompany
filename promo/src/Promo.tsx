import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { Beat, BeatKind, Format, SiteProps, TAIL, VO_OFFSET } from "./types";

// fonts are bundled in public/fonts (variable fonts: one file covers every weight)
const DISPLAY = "Bricolage Grotesque";
const BODY = "Inter";
loadFont({ family: DISPLAY, url: staticFile("fonts/Bricolage.woff2"), weight: "200 800" });
loadFont({ family: BODY, url: staticFile("fonts/Inter.woff2"), weight: "100 900" });

// ---------- colour helpers ----------
type RGB = [number, number, number];
const parse = (s: string): RGB => {
  const m = s.match(/(\d+)\D+(\d+)\D+(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [18, 113, 96];
};
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const palette = (accent: string) => {
  const a = parse(accent);
  // keep the accent readable on a dark ground: lift very dark brand colours
  const acc = lum(a) < 0.06 ? mix(a, [255, 255, 255], 0.35) : a;
  return {
    acc,
    deep: mix(a, [9, 11, 14], 0.86),
    deeper: mix(a, [5, 6, 8], 0.93),
    light: mix(acc, [255, 255, 255], 0.5),
    on: lum(acc) > 0.45 ? "#111" : "#fff",
  };
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);

// ---------- layouts: where the devices sit for each beat kind ----------
type Pose = { x: number; y: number; s: number; ry: number; rx: number; o: number };
type DevicePose = { browser: Pose; phone: Pose };
const P = (x: number, y: number, s: number, o = 1, ry = 0, rx = 0): Pose => ({ x, y, s, o, ry, rx });

const LAYOUT: Record<Format, Record<BeatKind, DevicePose>> = {
  walk: {
    hook: { browser: P(960, 1500, 0.6, 0, 0, 25), phone: P(1500, 1600, 0.6, 0) },
    brand: { browser: P(960, 640, 0.64, 1, 0, 8), phone: P(1560, 700, 0.56, 1) },
    feature: { browser: P(1240, 560, 0.62, 1, -16, 4), phone: P(1690, 620, 0.62, 1) },
    stat: { browser: P(1500, 640, 0.5, 0.07, -26, 4), phone: P(1800, 660, 0.5, 0.07) },
    agency: { browser: P(960, 1300, 0.5, 0, 0, 20), phone: P(1400, 1400, 0.5, 0) },
    cta: { browser: P(960, 1300, 0.52, 0, 0, 20), phone: P(1450, 1350, 0.5, 0) },
  },
  reel: {
    hook: { browser: P(540, 2300, 0.5, 0), phone: P(540, 2500, 1.1, 0) },
    brand: { browser: P(380, 1150, 0.48, 1, 14, 0), phone: P(690, 1250, 0.98, 1) },
    feature: { browser: P(330, 1250, 0.42, 0.9, 18, 0), phone: P(560, 1230, 1.06, 1) },
    stat: { browser: P(330, 1300, 0.42, 0.07, 18, 0), phone: P(560, 1280, 1.0, 0.07) },
    agency: { browser: P(330, 2400, 0.42, 0), phone: P(560, 2500, 1.0, 0) },
    cta: { browser: P(330, 2400, 0.42, 0), phone: P(560, 2500, 1.0, 0) },
  },
  teaser: {
    hook: { browser: P(540, 1500, 0.5, 0), phone: P(860, 1600, 0.5, 0) },
    brand: { browser: P(500, 640, 0.6, 1, 0, 8), phone: P(880, 700, 0.6, 1) },
    feature: { browser: P(500, 660, 0.58, 1, -10, 4), phone: P(880, 700, 0.6, 1) },
    stat: { browser: P(500, 660, 0.5, 0.07), phone: P(880, 700, 0.5, 0.07) },
    agency: { browser: P(540, 1500, 0.42, 0, 0, 20), phone: P(840, 1600, 0.42, 0) },
    cta: { browser: P(540, 1500, 0.5, 0), phone: P(860, 1600, 0.5, 0) },
  },
};

const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  s: a.s + (b.s - a.s) * t,
  ry: a.ry + (b.ry - a.ry) * t,
  rx: a.rx + (b.rx - a.rx) * t,
  o: a.o + (b.o - a.o) * t,
});

// ---------- background ----------
const Background: React.FC<{ pal: ReturnType<typeof palette> }> = ({ pal }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const blob = (i: number, size: number, alpha: number) => {
    const x = width * (0.5 + 0.38 * Math.sin(f / (90 + i * 23) + i * 2.1));
    const y = height * (0.5 + 0.36 * Math.cos(f / (110 + i * 17) + i * 1.3));
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${css(pal.acc, alpha)} 0%, transparent 65%)`,
        }}
      />
    );
  };
  const m = Math.max(width, height);
  return (
    <AbsoluteFill style={{ background: css(pal.deeper) }}>
      {blob(0, m * 1.1, 0.42)}
      {blob(1, m * 0.8, 0.28)}
      {blob(2, m * 0.9, 0.18)}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${css([255, 255, 255], 0.07)} 1.5px, transparent 1.5px)`,
          backgroundSize: "34px 34px",
          backgroundPosition: `${(f * 0.4) % 34}px ${(f * 0.25) % 34}px`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 45%, ${css(pal.deeper, 0.85)} 100%)` }} />
    </AbsoluteFill>
  );
};

// ---------- devices ----------
const Browser: React.FC<{ slug: string; scroll: number; domain: string }> = ({ slug, scroll, domain }) => (
  <div
    style={{
      width: 1440,
      borderRadius: 22,
      overflow: "hidden",
      background: "#fff",
      boxShadow: "0 80px 160px -40px rgba(0,0,0,.7), 0 0 0 1.5px rgba(255,255,255,.12)",
    }}
  >
    <div style={{ height: 52, background: "#f2f1ee", display: "flex", alignItems: "center", gap: 10, padding: "0 22px" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 15, height: 15, borderRadius: "50%", background: c }} />
      ))}
      <div
        style={{
          marginLeft: 24,
          width: 520,
          height: 32,
          borderRadius: 9,
          background: "#fff",
          border: "1px solid #e2e0da",
          fontFamily: BODY,
          fontSize: 17,
          color: "#666",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
        }}
      >
        🔒 {domain}
      </div>
    </div>
    <div style={{ height: 900, overflow: "hidden", position: "relative" }}>
      <Img
        src={staticFile(`sites/${slug}/desktop.jpg`)}
        style={{ position: "absolute", left: 0, top: 0, width: 1440, translate: `0px ${-scroll}px` }}
      />
    </div>
  </div>
);

const Phone: React.FC<{ slug: string; scroll: number }> = ({ slug, scroll }) => (
  <div
    style={{
      width: 426,
      height: 880,
      borderRadius: 66,
      background: "#0d0f10",
      padding: 18,
      boxShadow: "0 70px 140px -40px rgba(0,0,0,.75), inset 0 0 0 2px rgba(255,255,255,.14)",
    }}
  >
    <div style={{ width: 390, height: 844, borderRadius: 50, overflow: "hidden", position: "relative", background: "#fff" }}>
      <div style={{ position: "absolute", top: 12, left: 135, width: 120, height: 34, borderRadius: 20, background: "#0d0f10", zIndex: 2 }} />
      <Img
        src={staticFile(`sites/${slug}/mobile.jpg`)}
        style={{ position: "absolute", left: 0, top: 0, width: 390, translate: `0px ${-scroll + 0}px` }}
      />
    </div>
  </div>
);

const posed = (p: Pose, w: number, h: number, extra = ""): React.CSSProperties => ({
  position: "absolute",
  left: p.x - w / 2,
  top: p.y - h / 2,
  width: w,
  height: h,
  opacity: p.o,
  transformOrigin: "50% 50%",
  transform: `perspective(2400px) scale(${p.s}) rotateY(${p.ry}deg) rotateX(${p.rx}deg) ${extra}`,
});

// ---------- text pieces ----------
const Words: React.FC<{
  text: string;
  start: number; // frame
  span: number; // frames over which the words arrive
  size: number;
  highlight?: string[];
  pal: ReturnType<typeof palette>;
  align?: "left" | "center";
  maxWidth: number;
}> = ({ text, start, span, size, highlight = [], pal, align = "left", maxWidth }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(/\s+/);
  const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}$&']/gu, "");
  const hl = highlight.map(norm);
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: "-0.03em",
        color: "#fff",
        maxWidth,
        textAlign: align,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
        rowGap: size * 0.08,
      }}
    >
      {words.map((w, i) => {
        const at = start + (i / Math.max(1, words.length)) * span;
        const s = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160, mass: 0.6 } });
        const isHl = hl.includes(norm(w));
        const sweep = interpolate(f - at - 4, [0, 10], [0, 100], { ...clamp, easing: OUT });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
              translate: `0px ${(1 - s) * size * 0.55}px`,
              scale: `${0.85 + 0.15 * s}`,
              filter: `blur(${(1 - s) * 10}px)`,
              position: "relative",
              color: isHl ? pal.on : "#fff",
              padding: isHl ? `0 ${size * 0.14}px` : 0,
            }}
          >
            {isHl && (
              <span
                style={{
                  position: "absolute",
                  inset: `${size * 0.06}px 0 ${size * 0.02}px 0`,
                  background: css(pal.acc),
                  borderRadius: size * 0.16,
                  clipPath: `inset(0 ${100 - sweep}% 0 0 round ${size * 0.16}px)`,
                  zIndex: -1,
                }}
              />
            )}
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Subtitle: React.FC<{ beat: Beat; fps: number; pal: ReturnType<typeof palette>; size: number; bottom: number }> = ({
  beat,
  fps,
  pal,
  size,
  bottom,
}) => {
  const f = useCurrentFrame(); // relative to the beat
  const text = beat.sub ?? beat.say;
  const words = text.split(/\s+/);
  const dur = (beat.to - beat.from) * fps;
  const shown = interpolate(f, [0, dur * 0.92], [0, words.length], clamp);
  const o = interpolate(f, [0, 6, dur - 4, dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom, opacity: o }}>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.25,
          maxWidth: "84%",
          textAlign: "center",
          background: "rgba(0,0,0,.55)",
          padding: `${size * 0.32}px ${size * 0.6}px`,
          borderRadius: size * 0.5,
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: i < shown ? (i >= shown - 1 ? css(pal.light) : "#fff") : "rgba(255,255,255,.35)" }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- beats ----------
type BeatCtx = { beat: Beat; props: SiteProps; pal: ReturnType<typeof palette>; isLast: boolean };

const useExit = (beat: Beat, isLast: boolean) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = (beat.to - beat.from) * fps;
  if (isLast) return { opacity: 1, translate: "0px 0px" };
  const p = interpolate(f, [dur - 7, dur], [0, 1], { ...clamp, easing: INOUT });
  return { opacity: 1 - p, translate: `0px ${-p * 40}px`, filter: `blur(${p * 8}px)` };
};

const HookBeat: React.FC<BeatCtx> = ({ beat, props, pal, isLast }) => {
  const { fps, width } = useVideoConfig();
  const exit = useExit(beat, isLast);
  const size = props.format === "walk" ? 118 : props.format === "reel" ? 112 : 96;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...exit }}>
      <Words
        text={beat.title ?? beat.say}
        start={2}
        span={(beat.to - beat.from) * fps * 0.75}
        size={size}
        highlight={beat.highlight}
        pal={pal}
        align="center"
        maxWidth={width * 0.82}
      />
    </AbsoluteFill>
  );
};

const LogoMark: React.FC<{ letter: string; pal: ReturnType<typeof palette>; size: number; delay?: number }> = ({ letter, pal, size, delay = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 11, stiffness: 120 } });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: css(pal.acc),
        color: pal.on,
        display: "grid",
        placeItems: "center",
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size * 0.56,
        scale: `${s}`,
        rotate: `${(1 - s) * -40}deg`,
        boxShadow: `0 20px 60px -10px ${css(pal.acc, 0.6)}`,
      }}
    >
      {letter}
    </div>
  );
};

const BrandBeat: React.FC<BeatCtx> = ({ beat, props, pal, isLast }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(beat, isLast);
  const fmt = props.format;
  const nameSize = fmt === "walk" ? 104 : fmt === "reel" ? 110 : 84;
  const letters = props.brand.split("");
  const top = fmt === "walk" ? 70 : fmt === "reel" ? 210 : 70;
  const tag = interpolate(f, [16, 30], [0, 1], { ...clamp, easing: OUT });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top, ...exit }}>
      <div style={{ display: "flex", alignItems: "center", gap: nameSize * 0.32 }}>
        <LogoMark letter={props.brand.trim()[0].toUpperCase()} pal={pal} size={nameSize * 0.95} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: nameSize, color: "#fff", letterSpacing: "-0.03em", display: "flex", overflow: "hidden" }}>
          {letters.map((ch, i) => {
            const s = spring({ frame: f - 4 - i * 1.2, fps, config: { damping: 16, stiffness: 170 } });
            return (
              <span key={i} style={{ display: "inline-block", translate: `0px ${(1 - s) * nameSize}px`, opacity: s, whiteSpace: "pre" }}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: fmt === "walk" ? 36 : fmt === "reel" ? 44 : 32,
          color: css(pal.light),
          marginTop: 18,
          opacity: tag,
          translate: `0px ${(1 - tag) * 20}px`,
          letterSpacing: "0.01em",
          textAlign: "center",
          maxWidth: "86%",
        }}
      >
        {props.tagline}
      </div>
    </AbsoluteFill>
  );
};

const FeatureBeat: React.FC<BeatCtx> = ({ beat, props, pal, isLast }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const exit = useExit(beat, isLast);
  const fmt = props.format;
  const size = fmt === "walk" ? 98 : fmt === "reel" ? 100 : 72;
  const bar = interpolate(f, [8, 24], [0, 1], { ...clamp, easing: OUT });
  const box: React.CSSProperties =
    fmt === "walk"
      ? { left: 120, top: 0, bottom: 0, width: 720, justifyContent: "center" }
      : fmt === "reel"
        ? { left: 80, right: 80, top: 190, alignItems: "center" }
        : { left: 70, right: 70, top: 60 };
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", gap: 26, ...box }}>
        <Words
          text={beat.title ?? beat.say}
          start={1}
          span={10}
          size={size}
          highlight={beat.highlight}
          pal={pal}
          align={fmt === "reel" ? "center" : "left"}
          maxWidth={fmt === "walk" ? 720 : width - 160}
        />
        <div style={{ height: 10, width: (fmt === "teaser" ? 140 : 200) * bar, borderRadius: 6, background: css(pal.acc) }} />
      </div>
    </AbsoluteFill>
  );
};

const StatBeat: React.FC<BeatCtx> = ({ beat, props, pal, isLast }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(beat, isLast);
  const stat = beat.stat ?? "";
  const m = stat.match(/^(\D*)([\d,.]+)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const p = interpolate(f, [4, 26], [0, 1], { ...clamp, easing: OUT });
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const value = m
    ? `${m[1]}${(target * p).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${m[3]}`
    : stat;
  const size = props.format === "walk" ? 260 : props.format === "reel" ? 280 : 210;
  const pop = spring({ frame: f - 2, fps, config: { damping: 10, stiffness: 140 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...exit }}>
      {[0, 1, 2].map((i) => {
        const r = interpolate(f - i * 6, [0, 40], [0, 1], { ...clamp, easing: OUT });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size * 4 * r,
              height: size * 4 * r,
              borderRadius: "50%",
              border: `3px solid ${css(pal.acc, 0.6 * (1 - r))}`,
            }}
          />
        );
      })}
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: size * 0.17, color: css(pal.light), letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {beat.statLabel}
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, scale: `${0.7 + 0.3 * pop}`, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </AbsoluteFill>
  );
};

const AgencyBeat: React.FC<BeatCtx> = ({ beat, props, pal, isLast }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(beat, isLast);
  const s = spring({ frame: f - 2, fps, config: { damping: 14 } });
  const size = props.format === "walk" ? 92 : 76;
  const petal = (rot: number, color: string, i: number) => {
    const ps = spring({ frame: f - i * 4, fps, config: { damping: 10, stiffness: 120 } });
    return <ellipse key={i} cx="20" cy="11" rx="6" ry="10" fill={color} transform={`rotate(${rot} 20 22)`} style={{ opacity: ps }} />;
  };
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30, ...exit }}>
      <svg viewBox="0 0 40 40" width={size * 1.6} height={size * 1.6} style={{ scale: `${s}`, rotate: `${(1 - s) * 90}deg` }}>
        {petal(0, "#22c55e", 0)}
        {petal(120, "#4ade80", 1)}
        {petal(240, "#f97350", 2)}
        <circle cx="20" cy="22" r="3.2" fill="#fff" />
      </svg>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: size * 0.36, color: css(pal.light), letterSpacing: "0.16em", textTransform: "uppercase", opacity: s }}>
        Designed &amp; built by
      </div>
      <Words text="The Trillium Company" start={6} span={10} size={size} pal={pal} align="center" maxWidth={1000} />
    </AbsoluteFill>
  );
};

const CtaBeat: React.FC<BeatCtx> = ({ beat, props, pal }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fmt = props.format;
  const size = fmt === "walk" ? 120 : fmt === "reel" ? 116 : 88;
  const btn = spring({ frame: f - 10, fps, config: { damping: 12 } });
  const clickAt = Math.min(34, (beat.to - beat.from) * fps * 0.55);
  // cursor glides in, presses the button, ripple expands
  const cur = interpolate(f, [14, clickAt], [0, 1], { ...clamp, easing: INOUT });
  const press = interpolate(f, [clickAt, clickAt + 3, clickAt + 8], [1, 0.92, 1], clamp);
  const ripple = interpolate(f, [clickAt, clickAt + 22], [0, 1], { ...clamp, easing: OUT });
  const label = props.ctaButton ?? props.domain ?? props.ctaLabel;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: fmt === "teaser" ? 34 : 50 }}>
      <Words text={beat.title ?? beat.say} start={0} span={10} size={size} highlight={beat.highlight} pal={pal} align="center" maxWidth={width * 0.86} />
      <div style={{ position: "relative", scale: `${btn * press}` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: `4px solid ${css(pal.acc, 1 - ripple)}`,
            scale: `${1 + ripple * 0.5}`,
          }}
        />
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: fmt === "walk" ? 50 : fmt === "reel" ? 54 : 40,
            background: css(pal.acc),
            color: pal.on,
            padding: fmt === "teaser" ? "22px 46px" : "28px 64px",
            borderRadius: 999,
            boxShadow: `0 24px 70px -12px ${css(pal.acc, 0.7)}`,
            whiteSpace: "nowrap",
          }}
        >
          {label} →
        </div>
      </div>
      <svg
        width={fmt === "teaser" ? 46 : 60}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: interpolate(cur, [0, 1], [width * 0.85, width * 0.56]),
          top: interpolate(cur, [0, 1], [height * 0.95, height * (fmt === "reel" ? 0.56 : 0.62)]),
          opacity: interpolate(f, [12, 18], [0, 1], clamp),
          scale: `${press}`,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))",
        }}
      >
        <path d="M4 2l15 10-7 1.5L8.5 21z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

const BEATS: Record<BeatKind, React.FC<BeatCtx>> = {
  hook: HookBeat,
  brand: BrandBeat,
  feature: FeatureBeat,
  stat: StatBeat,
  agency: AgencyBeat,
  cta: CtaBeat,
};

// ---------- main ----------
export const Promo: React.FC<SiteProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const pal = palette(props.accent);
  const t = frame / fps - VO_OFFSET; // time on the voiceover clock
  const beats = props.beats;
  const layout = LAYOUT[props.format];

  // which beat are we in, and how far into its entrance
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].from) bi = i;
  const cur = beats[bi];
  const prev = beats[Math.max(0, bi - 1)];
  const k = interpolate(t, [cur.from, cur.from + 0.75], [0, 1], { ...clamp, easing: INOUT });
  const pose = {
    browser: lerpPose(layout[prev.kind].browser, layout[cur.kind].browser, bi === 0 ? 1 : k),
    phone: lerpPose(layout[prev.kind].phone, layout[cur.kind].phone, bi === 0 ? 1 : k),
  };
  // scroll positions carry over between beats
  const lastDefined = (key: "dy" | "my", upto: number) => {
    for (let i = upto; i >= 0; i--) if (beats[i][key] !== undefined) return beats[i][key] as number;
    return 0;
  };
  const sk = interpolate(t, [cur.from, cur.from + 1.1], [0, 1], { ...clamp, easing: INOUT });
  const dy = lastDefined("dy", bi - 1) + (lastDefined("dy", bi) - lastDefined("dy", bi - 1)) * sk;
  const my = lastDefined("my", bi - 1) + (lastDefined("my", bi) - lastDefined("my", bi - 1)) * sk;
  // a slow drift so the devices never sit perfectly still
  const drift = Math.sin(frame / 40) * 6;

  const voEnd = props.voDuration;
  const subSize = props.format === "walk" ? 44 : props.format === "reel" ? 50 : 38;
  const subBottom = props.format === "walk" ? 56 : props.format === "reel" ? 150 : 46;

  return (
    <AbsoluteFill style={{ fontFamily: BODY, overflow: "hidden" }}>
      <Background pal={pal} />

      {/* devices */}
      <div style={{ ...posed({ ...pose.browser, y: pose.browser.y + drift }, 1440, 952) }}>
        <Browser slug={props.slug} scroll={Math.min(dy, Math.max(0, props.desktopH - 900))} domain={props.domain ?? props.brand} />
      </div>
      <div style={{ ...posed({ ...pose.phone, y: pose.phone.y - drift }, 426, 880) }}>
        <Phone slug={props.slug} scroll={Math.min(my, Math.max(0, props.mobileH - 844))} />
      </div>

      {/* text beats */}
      {beats.map((b, i) => {
        const from = Math.round((b.from + VO_OFFSET) * fps);
        const isLast = i === beats.length - 1;
        const to = isLast ? durationInFrames : Math.round((b.to + VO_OFFSET) * fps);
        const C = BEATS[b.kind];
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} name={`${b.kind}: ${b.title ?? b.say}`}>
            <C beat={b} props={props} pal={pal} isLast={isLast} />
          </Sequence>
        );
      })}

      {/* subtitles for beats whose headline differs from what is said */}
      {beats.map((b, i) =>
        b.kind === "hook" || b.kind === "cta" || b.kind === "stat" || b.kind === "agency" ? null : (
          <Sequence key={`s${i}`} from={Math.round((b.from + VO_OFFSET) * fps)} durationInFrames={Math.max(1, Math.round((b.to - b.from) * fps))}>
            <Subtitle beat={b} fps={fps} pal={pal} size={subSize} bottom={subBottom} />
          </Sequence>
        ),
      )}

      {/* audio: voiceover, music ducked under it, and hits on each beat */}
      <Sequence from={Math.round(VO_OFFSET * fps)}>
        <Audio src={staticFile(props.vo)} />
      </Sequence>
      <Audio
        src={staticFile(props.music)}
        volume={(f) => {
          const s = f / fps;
          const end = durationInFrames / fps;
          const duck = interpolate(s, [0, VO_OFFSET, VO_OFFSET + 0.3, VO_OFFSET + voEnd, VO_OFFSET + voEnd + 0.4], [0.5, 0.55, 0.16, 0.16, 0.5], clamp);
          return duck * interpolate(s, [end - 1, end], [1, 0], clamp);
        }}
      />
      {beats.map((b, i) => {
        const at = Math.round((b.from + VO_OFFSET) * fps);
        const sfx =
          b.kind === "brand" || b.kind === "agency" ? "sfx/impact.mp3" : b.kind === "stat" ? "sfx/pop.mp3" : i === 0 ? null : "sfx/whoosh.mp3";
        return sfx ? (
          <Sequence key={`x${i}`} from={Math.max(0, at - 4)} durationInFrames={60}>
            <Audio src={staticFile(sfx)} volume={b.kind === "brand" ? 0.55 : 0.4} />
          </Sequence>
        ) : null;
      })}
      {(() => {
        const last = beats[beats.length - 1];
        if (last.kind !== "cta") return null;
        const clickAt = Math.round((last.from + VO_OFFSET) * fps + Math.min(34, (last.to - last.from) * fps * 0.55));
        return (
          <Sequence from={clickAt} durationInFrames={30}>
            <Audio src={staticFile("sfx/click.mp3")} volume={0.7} />
          </Sequence>
        );
      })()}
    </AbsoluteFill>
  );
};

export const promoDuration = (p: SiteProps, fps: number) => Math.ceil((VO_OFFSET + p.voDuration + TAIL) * fps);
