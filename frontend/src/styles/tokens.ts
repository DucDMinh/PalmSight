/**
 * PalmSight Terminal Minimalist Design Tokens
 * Synced from Stitch Project: PalmSight Terminal Landing Page (15464591816682045618)
 * Design System: OpenCode-design-analysis (assets/35004d5622bc42b9bbcd06b9ad384b31)
 */

export const PALMSIGHT_TOKENS = {
  colors: {
    // Primary & Surfaces
    canvas: "#fdfcfc",
    ink: "#201d1d",
    inkDeep: "#0f0000",
    charcoal: "#302c2c",
    body: "#424245",
    mute: "#646262",
    stone: "#6e6e73",
    ash: "#9a9898",
    surfaceSoft: "#f8f7f7",
    surfaceCard: "#f1eeee",
    surfaceDark: "#201d1d",
    surfaceDarkElevated: "#302c2c",
    hairline: "rgba(15, 0, 0, 0.12)",
    hairlineStrong: "#646262",
    onDark: "#fdfcfc",
    onDarkMute: "#9a9898",

    // Semantic Accents (in-TUI & status signals)
    accent: "#007aff",
    accentHover: "#0056b3",
    accentActive: "#004085",
    warning: "#ff9f0a",
    warningHover: "#cc7f08",
    warningActive: "#995f06",
    danger: "#ba1a1a",
    dangerHover: "#93000a",
    dangerActive: "#690005",
    success: "#1b6e32",
  },
  typography: {
    fontFamily:
      "'JetBrains Mono', 'IBM Plex Mono', 'Berkeley Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    displayXl: {
      fontSize: "38px",
      fontWeight: 700,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    headingLg: {
      fontSize: "24px",
      fontWeight: 700,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    headingMd: {
      fontSize: "16px",
      fontWeight: 700,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    headingSm: {
      fontSize: "14px",
      fontWeight: 700,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    bodyMd: {
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    bodyStrong: {
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    buttonMd: {
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: 2,
      letterSpacing: "0",
    },
    captionMd: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 2,
      letterSpacing: "0",
    },
    codeSm: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
  },
  radius: {
    none: "0px",
    sm: "4px",
    default: "4px",
    full: "9999px",
  },
  spacing: {
    xxs: "1px",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    section: "96px",
  },
} as const;

export type PalmSightTokens = typeof PALMSIGHT_TOKENS;
