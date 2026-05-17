import { motion } from "motion/react";
import Link from "next/link";
import type { PlayerScore } from "../types/room";
import * as styles from "../styles/room.css";

interface Props {
  myPlayerId: string;
  scores: PlayerScore[];
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function RoomFinalScreen({ myPlayerId, scores }: Props) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className={styles.finalPage}>
      <div className={styles.finalCard}>
        <div className={styles.finalHeading}>Final scores</div>
        {sorted.map((entry, index) => (
          <motion.div
            key={entry.playerId}
            animate={{ opacity: 1, y: 0 }}
            className={styles.finalEntry}
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: index * 0.08, duration: 0.32, ease: "easeOut" }}
          >
            <span className={styles.finalRank}>
              {RANK_MEDALS[index] ?? `${index + 1}.`}
            </span>
            <span
              className={styles.finalName}
              data-me={entry.playerId === myPlayerId ? "true" : "false"}
            >
              {entry.name}
              {entry.playerId === myPlayerId ? " (you)" : ""}
            </span>
            <span className={styles.finalScore}>{entry.score}</span>
          </motion.div>
        ))}
        <div className={styles.actions}>
          <Link
            href="/room"
            style={{
              alignItems: "center",
              background: "var(--wt-color-accent)",
              borderRadius: "var(--wt-radius-sm)",
              color: "var(--wt-color-accentText)",
              display: "flex",
              fontSize: "var(--wt-fontSize-base)",
              fontWeight: "var(--wt-fontWeight-bold)",
              height: "var(--wt-size-controlHeight)",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            New room
          </Link>
          <Link
            href="/"
            style={{
              alignItems: "center",
              borderRadius: "var(--wt-radius-sm)",
              border: "1px solid var(--wt-color-border)",
              color: "var(--wt-color-text)",
              display: "flex",
              fontSize: "var(--wt-fontSize-base)",
              fontWeight: "var(--wt-fontWeight-medium)",
              height: "var(--wt-size-controlHeight)",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
