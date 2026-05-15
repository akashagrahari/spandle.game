import { style, keyframes } from "@vanilla-extract/css";
import { media, zIndex } from "./foundation";
import { vars } from "./theme.css";

export const page = style({
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: "100dvh",
  padding: `0 ${vars.space.xl}`,
  "@media": {
    [media.compact]: {
      padding: `0 ${vars.space.lg}`,
    },
  },
});

export const card = style({
  background: vars.color.surface,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.xl,
  padding: vars.space["3xl"],
  width: `min(100%, ${vars.size.contentWidth})`,
  "@media": {
    [media.compact]: {
      borderRadius: vars.radius.lg,
      padding: vars.space["2xl"],
    },
  },
});

export const heading = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  lineHeight: vars.lineHeight.tight,
  marginBottom: vars.space.xl,
});

export const subheading = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  marginBottom: vars.space.lg,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: vars.fontWeight.semibold,
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.lg,
  marginBottom: vars.space["2xl"],
});

export const fieldLabel = style({
  color: vars.color.textMuted,
  display: "block",
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  marginBottom: vars.space.xs,
});

export const fieldSelect = style({
  appearance: "none",
  background: vars.color.backdrop,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  color: vars.color.text,
  fontSize: vars.fontSize.base,
  height: vars.size.controlHeight,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space["2xl"],
  width: "100%",
  cursor: "pointer",
  ":focus": {
    outline: `${vars.size.outlineWidth} solid ${vars.color.accent}`,
    outlineOffset: "2px",
  },
});

export const fieldInput = style({
  background: vars.color.backdrop,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  color: vars.color.text,
  fontSize: vars.fontSize.base,
  height: vars.size.controlHeight,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  width: "100%",
  ":focus": {
    outline: `${vars.size.outlineWidth} solid ${vars.color.accent}`,
    outlineOffset: "2px",
  },
  "::placeholder": {
    color: vars.color.textSubtle,
  },
});

export const radioGroup = style({
  display: "flex",
  gap: vars.space.sm,
  flexWrap: "wrap",
});

export const radioChip = style({
  alignItems: "center",
  background: vars.color.backdrop,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.pill,
  color: vars.color.textMuted,
  cursor: "pointer",
  display: "flex",
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  height: vars.size.chipHeight,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  transition: `background ${vars.duration.fast} ${vars.easing.standard}, color ${vars.duration.fast} ${vars.easing.standard}, border-color ${vars.duration.fast} ${vars.easing.standard}`,
  selectors: {
    "&[aria-pressed='true']": {
      background: vars.color.accent,
      borderColor: vars.color.accent,
      color: vars.color.accentText,
    },
  },
});

// ---- Lobby ----

export const lobbyPage = style({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xl,
  width: `min(100%, ${vars.size.contentWidth})`,
});

export const codeDisplay = style({
  background: vars.color.accentTint,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  fontFamily: vars.font.display,
  fontSize: vars.fontSize["2xl"],
  fontWeight: vars.fontWeight.black,
  letterSpacing: "0.15em",
  padding: `${vars.space.xl} ${vars.space["2xl"]}`,
  textAlign: "center",
});

export const codeLabel = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: vars.space.xs,
  textAlign: "center",
});

export const playerList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

export const playerRow = style({
  alignItems: "center",
  background: vars.color.surface,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  display: "flex",
  gap: vars.space.md,
  padding: `${vars.space.md} ${vars.space.lg}`,
});

export const playerDot = style({
  borderRadius: vars.radius.pill,
  flexShrink: 0,
  height: "0.5rem",
  width: "0.5rem",
  selectors: {
    "[data-connected='true'] &": {
      background: vars.color.success,
    },
    "[data-connected='false'] &": {
      background: vars.color.textSubtle,
    },
  },
});

export const playerName = style({
  flex: 1,
  fontSize: vars.fontSize.base,
  fontWeight: vars.fontWeight.medium,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const playerBadge = style({
  color: vars.color.textSubtle,
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
});

export const waitingText = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  textAlign: "center",
});

// ---- Game Board ----

export const boardPage = style({
  display: "flex",
  flexDirection: "column",
  height: "100dvh",
  overflow: "hidden",
  position: "relative",
});

export const boardTopBar = style({
  alignItems: "center",
  borderBottom: `${vars.size.borderWidth} solid ${vars.color.border}`,
  display: "grid",
  flexShrink: 0,
  gridTemplateColumns: "1fr auto 1fr",
  padding: `${vars.space.md} ${vars.space.xl}`,
});

export const boardTopBarRight = style({
  display: "flex",
  justifyContent: "flex-end",
});

export const boardTitle = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.md,
  fontWeight: vars.fontWeight.bold,
});

const pulse = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

export const timerChip = style({
  alignItems: "center",
  background: vars.color.chip,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.pill,
  display: "flex",
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.bold,
  gap: vars.space.xs,
  height: vars.size.chipHeight,
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  selectors: {
    "&[data-urgent='true']": {
      background: vars.color.dangerSoft,
      borderColor: vars.color.danger,
      color: vars.color.danger,
      animationName: pulse,
      animationDuration: "0.8s",
      animationTimingFunction: "ease-in-out",
      animationIterationCount: "infinite",
    },
  },
});

export const boardContent = style({
  display: "flex",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
});

export const boardMain = style({
  flex: 1,
  minWidth: 0,
  position: "relative",
});

export const lockedOverlay = style({
  alignItems: "center",
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  justifyContent: "center",
  left: 0,
  pointerEvents: "none",
  position: "absolute",
  right: 0,
  top: 0,
  zIndex: zIndex.floating,
});

export const lockedBadge = style({
  background: vars.color.surface,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.pill,
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.semibold,
  padding: `${vars.space.sm} ${vars.space.xl}`,
});

// ---- Leaderboard sidebar ----

export const leaderboardSidebar = style({
  background: vars.color.surfaceChrome,
  borderLeft: `${vars.size.borderWidth} solid ${vars.color.border}`,
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  gap: vars.space.sm,
  overflow: "hidden",
  overflowY: "auto",
  padding: vars.space.lg,
  width: "13rem",
  "@media": {
    [media.compact]: {
      display: "none",
    },
  },
});

export const leaderboardTitle = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.semibold,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

export const leaderboardEntry = style({
  alignItems: "center",
  display: "flex",
  gap: vars.space.sm,
  padding: `${vars.space.xs} 0`,
});

export const leaderboardRank = style({
  color: vars.color.textSubtle,
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.bold,
  minWidth: "1.25rem",
  textAlign: "right",
});

export const leaderboardName = style({
  color: vars.color.text,
  flex: 1,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  selectors: {
    "&[data-me='true']": {
      fontWeight: vars.fontWeight.bold,
    },
  },
});

export const leaderboardScore = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.bold,
});

// ---- Final leaderboard ----

export const finalPage = style({
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: "100dvh",
  padding: `${vars.space["3xl"]} ${vars.space.xl}`,
  "@media": {
    [media.compact]: {
      padding: `${vars.space["2xl"]} ${vars.space.lg}`,
    },
  },
});

export const finalCard = style({
  background: vars.color.surface,
  border: `${vars.size.borderWidth} solid ${vars.color.border}`,
  borderRadius: vars.radius.xl,
  padding: vars.space["3xl"],
  width: `min(100%, ${vars.size.contentWidth})`,
});

export const finalHeading = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize["2xl"],
  fontWeight: vars.fontWeight.black,
  marginBottom: vars.space["2xl"],
  textAlign: "center",
});

export const finalEntry = style({
  alignItems: "center",
  borderBottom: `${vars.size.borderWidth} solid ${vars.color.border}`,
  display: "flex",
  gap: vars.space.md,
  padding: `${vars.space.md} 0`,
  selectors: {
    "&:last-child": {
      borderBottom: "none",
    },
  },
});

export const finalRank = style({
  color: vars.color.textSubtle,
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.black,
  minWidth: "2rem",
  textAlign: "center",
});

export const finalName = style({
  color: vars.color.text,
  flex: 1,
  fontSize: vars.fontSize.base,
  fontWeight: vars.fontWeight.medium,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  selectors: {
    "&[data-me='true']": {
      fontWeight: vars.fontWeight.bold,
    },
  },
});

export const finalScore = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.base,
  fontWeight: vars.fontWeight.bold,
});

export const actions = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  marginTop: vars.space["2xl"],
});

// ---- Name entry ----

export const namePage = style({
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: "100dvh",
  padding: `0 ${vars.space.xl}`,
});
