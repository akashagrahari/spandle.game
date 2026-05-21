import React from "react";
import type { ClientRoomState } from "../types/room";
import SiteHeader from "./site-header";
import * as styles from "../styles/room.css";

interface Props {
  onStart: () => void;
  roomState: ClientRoomState;
}

export default function RoomLobby({ onStart, roomState }: Props) {
  const { code, config, isHost, players, playerId } = roomState;
  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${code}`
      : `/room/${code}`;

  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    void navigator.clipboard?.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const difficultyLabel =
    config.maxRounds === 0
      ? "Unlimited rounds"
      : `${config.maxRounds} rounds`;
  const timerLabel = `${config.roundSeconds}s per card`;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.lobbyPage}>
        <div>
          <div className={styles.codeLabel}>Room code</div>
          <div
            className={styles.codeDisplay}
            onClick={handleCopy}
            style={{ cursor: "pointer" }}
            title="Click to copy link"
          >
            {code}
          </div>
          <div
            style={{
              color: "var(--wt-color-textSubtle)",
              fontSize: "0.75rem",
              marginTop: "0.375rem",
              textAlign: "center",
            }}
          >
            {copied ? "Link copied!" : "Click to copy invite link"}
          </div>
        </div>

        <div>
          <div className={styles.subheading}>
            {players.length} player{players.length !== 1 ? "s" : ""} •{" "}
            {difficultyLabel} • {timerLabel}
          </div>
          <div className={styles.playerList}>
            {players.map((p) => (
              <div
                key={p.id}
                className={styles.playerRow}
                data-connected={p.connected ? "true" : "false"}
              >
                <span className={styles.playerDot} />
                <span className={styles.playerName}>
                  {p.name}
                  {p.id === playerId ? " (you)" : ""}
                </span>
                {p.id === roomState.hostId && (
                  <span className={styles.playerBadge}>Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            disabled={players.length === 0}
            onClick={onStart}
            style={{
              background: "var(--wt-color-accent)",
              border: "none",
              borderRadius: "var(--wt-radius-sm)",
              color: "var(--wt-color-accentText)",
              cursor: players.length > 0 ? "pointer" : "not-allowed",
              fontSize: "var(--wt-fontSize-base)",
              fontWeight: "var(--wt-fontWeight-bold)",
              height: "var(--wt-size-controlHeight)",
              opacity: players.length === 0 ? 0.5 : 1,
              width: "100%",
            }}
          >
            Start game
          </button>
        ) : (
          <div className={styles.waitingText}>Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
