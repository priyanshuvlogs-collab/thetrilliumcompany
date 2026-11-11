export type Format = "walk" | "reel" | "teaser";

export type BeatKind = "hook" | "brand" | "feature" | "stat" | "agency" | "cta";

export type Beat = {
  kind: BeatKind;
  /** seconds, relative to the start of the voiceover */
  from: number;
  to: number;
  /** words as spoken (used for subtitles) */
  say: string;
  /** subtitle text as it should read (e.g. "$250" for "two hundred and fifty dollars") */
  sub?: string;
  /** big on-screen headline; falls back to `say` */
  title?: string;
  /** words in the title to paint in the accent colour */
  highlight?: string[];
  /** scroll targets (css px of the captured page) */
  dy?: number;
  my?: number;
  /** stat beats: the number and its label */
  stat?: string;
  statLabel?: string;
};

export type SiteProps = {
  slug: string;
  format: Format;
  brand: string;
  tagline: string;
  accent: string; // "rgb(r,g,b)"
  domain?: string | null;
  ctaLabel: string;
  /** text on the CTA button; defaults to the domain */
  ctaButton?: string | null;
  desktopH: number;
  mobileH: number;
  vo: string; // path in public/
  voDuration: number;
  music: string;
  beats: Beat[];
};

export const DIMS: Record<Format, [number, number]> = {
  walk: [1920, 1080],
  reel: [1080, 1920],
  teaser: [1080, 1080],
};

export const FPS = 30;
export const VO_OFFSET = 0.6; // music intro before the voice starts
export const TAIL = 1.8; // end card hold after the voice ends
