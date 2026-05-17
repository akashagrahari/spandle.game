import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { bodyText, modalCard, overlay as overlayBase } from "./ui.css";

export const overlay = overlayBase;

export const modal = style([
  modalCard,
  {
    gap: vars.space.xl,
  },
]);

export const header = style({
  alignItems: "flex-start",
  display: "flex",
  justifyContent: "space-between",
});

export const title = style({
  color: vars.color.text,
  fontFamily: vars.font.display,
  fontSize: vars.fontSize["2xl"],
  fontWeight: vars.fontWeight.bold,
  letterSpacing: "-0.03em",
  lineHeight: vars.lineHeight.tight,
  margin: 0,
});

export const closeButton = style({
  alignItems: "center",
  background: "none",
  border: "none",
  borderRadius: vars.radius.sm,
  color: vars.color.textMuted,
  cursor: "pointer",
  display: "flex",
  flexShrink: 0,
  justifyContent: "center",
  marginTop: "2px",
  padding: vars.space.xs,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
  },
});

export const steps = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.lg,
  listStyle: "none",
  margin: 0,
  padding: 0,
});

export const step = style({
  alignItems: "flex-start",
  display: "flex",
  gap: vars.space.md,
});

export const stepNumber = style({
  alignItems: "center",
  background: vars.color.accentTint,
  borderRadius: vars.radius.pill,
  color: vars.color.text,
  display: "flex",
  flexShrink: 0,
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.bold,
  height: "1.5rem",
  justifyContent: "center",
  letterSpacing: "0.04em",
  marginTop: "2px",
  width: "1.5rem",
});

export const stepText = style([
  bodyText,
  {
    textAlign: "left",
  },
]);

export const tip = style([
  bodyText,
  {
    background: vars.color.accentTint,
    borderRadius: vars.radius.md,
    color: vars.color.textMuted,
    fontSize: vars.fontSize.sm,
    padding: `${vars.space.md} ${vars.space.lg}`,
    textAlign: "left",
  },
]);

export const tipLabel = style({
  color: vars.color.text,
  fontWeight: vars.fontWeight.bold,
  marginRight: vars.space.xs,
});
