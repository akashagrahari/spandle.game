import { style } from "@vanilla-extract/css";
import { action, actionContent, actionIcon, actionLabel } from "./ui.css";

export const button = action({ tone: "primary" });
export const minimal = action({ tone: "outlined" });

export const fullWidth = style({
  width: "100%",
});

export const withTrailingIcon = style({
  justifyContent: "space-between",
});

export const content = actionContent;

export const label = actionLabel;

export const icon = actionIcon;
