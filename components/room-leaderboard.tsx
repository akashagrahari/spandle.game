import type { PlayerScore } from "../types/room";
import * as styles from "../styles/room.css";

interface Props {
  myPlayerId: string;
  scores: PlayerScore[];
}

export default function RoomLeaderboard({ myPlayerId, scores }: Props) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <aside className={styles.leaderboardSidebar}>
      <div className={styles.leaderboardTitle}>Scores</div>
      {sorted.map((entry, index) => (
        <div key={entry.playerId} className={styles.leaderboardEntry}>
          <span className={styles.leaderboardRank}>{index + 1}</span>
          <span
            className={styles.leaderboardName}
            data-me={entry.playerId === myPlayerId ? "true" : "false"}
          >
            {entry.name}
          </span>
          <span className={styles.leaderboardScore}>{entry.score}</span>
        </div>
      ))}
    </aside>
  );
}
