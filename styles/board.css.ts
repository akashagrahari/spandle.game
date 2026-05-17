import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const wrapper = style({
  color: vars.color.text,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
  width: "100%",
});

export const top = style({
  alignItems: "center",
  display: "flex",
  flex: "0 0 50%",
  flexDirection: "column",
  gap: vars.space.xl,
  justifyContent: "flex-end",
  minHeight: 0,
  paddingTop: vars.space.xl,
  position: "relative",
});

export const topGameOver = style({
  justifyContent: "center",
  paddingBottom: vars.space.lg,
  paddingTop: vars.space.lg,
});

export const statusArea = style({
  position: "relative",
  width: `min(100%, ${vars.size.boardStatusWidth})`,
});

export const statusLayer = style({
  display: "flex",
  justifyContent: "center",
  width: "100%",
});

const gameOverFlashKf = keyframes({
  "0%": { opacity: 0 },
  "18%": { opacity: 0.22 },
  "100%": { opacity: 0 },
});

export const gameOverFlash = style({
  animation: `${gameOverFlashKf} 520ms ease-out forwards`,
  background: "rgba(159, 104, 97, 1)",
  inset: 0,
  pointerEvents: "none",
  position: "absolute",
  zIndex: 10,
});

export const bottom = style({
  alignItems: "flex-start",
  display: "flex",
  flex: "0 0 50%",
  minHeight: 0,
  overflowX: "auto",
  overflowY: "hidden",
  paddingTop: vars.space.lg,
  position: "relative",
  width: "100%",
});
