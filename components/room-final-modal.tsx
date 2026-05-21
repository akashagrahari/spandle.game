import { AnimatePresence, motion } from "motion/react";
import React from "react";
import * as roomStyles from "../styles/room.css";
import * as ui from "../styles/ui.css";
import type { PlayerScore } from "../types/room";

interface Props {
  myPlayerId: string;
  onClose: () => void;
  open: boolean;
  scores: PlayerScore[];
}

export default function RoomFinalModal({
  myPlayerId,
  onClose,
  open,
  scores,
}: Props) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-labelledby="final-scores-title"
          aria-modal="true"
          className={ui.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={ui.modalCard}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "85dvh",
              overflow: "hidden",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header — always visible */}
            <div
              style={{
                alignItems: "flex-start",
                display: "flex",
                flexShrink: 0,
                justifyContent: "space-between",
                marginBottom: "var(--wt-space-lg)",
              }}
            >
              <div
                className={roomStyles.finalHeading}
                id="final-scores-title"
                style={{ marginBottom: 0 }}
              >
                Final scores
              </div>
              <button
                aria-label="Close"
                onClick={onClose}
                style={{
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  borderRadius: "var(--wt-radius-sm)",
                  color: "var(--wt-color-textMuted)",
                  cursor: "pointer",
                  display: "flex",
                  flexShrink: 0,
                  justifyContent: "center",
                  marginTop: "2px",
                  padding: "var(--wt-space-xs)",
                }}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="18"
                  viewBox="0 0 18 18"
                  width="18"
                >
                  <path
                    d="M4 4L14 14M14 4L4 14"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>

            {/* Player list — scrolls when tall */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {sorted.map((entry, index) => (
                <motion.div
                  key={entry.playerId}
                  animate={{ opacity: 1, y: 0 }}
                  className={roomStyles.finalEntry}
                  initial={{ opacity: 0, y: 16 }}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.32,
                    ease: "easeOut",
                  }}
                >
                  <span className={roomStyles.finalRank}>
                    {index + 1}.
                  </span>
                  <span
                    className={roomStyles.finalName}
                    data-me={entry.playerId === myPlayerId ? "true" : "false"}
                  >
                    {entry.name}
                    {entry.playerId === myPlayerId ? " (you)" : ""}
                  </span>
                  <span className={roomStyles.finalScore}>{entry.score}</span>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
