import React from "react";
import { createRoom } from "../lib/use-room";
import type { DeckNode } from "../types/decks";
import * as styles from "../styles/room.css";

interface FlatDeck {
  id: string;
  title: string;
}

function flattenLeafDecks(node: DeckNode, out: FlatDeck[] = []): FlatDeck[] {
  if (!node.children || node.children.length === 0) {
    out.push({ id: node.id, title: node.title });
    return out;
  }
  for (const child of node.children) {
    flattenLeafDecks(child, out);
  }
  return out;
}

interface Props {
  deckTree: DeckNode | null;
  onCreated: (code: string, hostId: string) => void;
}

export default function RoomCreateScreen({ deckTree, onCreated }: Props) {
  const leafDecks = React.useMemo(() => {
    if (!deckTree) return [];
    const leaves = flattenLeafDecks(deckTree);
    return [{ id: deckTree.id, title: deckTree.title }, ...leaves];
  }, [deckTree],
  );

  const [deckId, setDeckId] = React.useState<string>("");
  const [roundSeconds, setRoundSeconds] = React.useState(30);
  const [maxRounds, setMaxRounds] = React.useState<number | "unlimited">(15);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (leafDecks.length > 0 && !deckId) {
      setDeckId(leafDecks[0].id);
    }
  }, [leafDecks, deckId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deckId) return;

    setCreating(true);
    setError(null);
    try {
      const { code, hostId } = await createRoom({
        config: {
          deckId,
          roundSeconds,
          maxRounds: maxRounds === "unlimited" ? 0 : maxRounds,
        },
      });
      onCreated(code, hostId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      setCreating(false);
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.heading}>Create a room</div>

        <div className={styles.fieldGroup}>
          <div>
            <label className={styles.fieldLabel} htmlFor="deck-select">
              Deck
            </label>
            <select
              className={styles.fieldSelect}
              id="deck-select"
              onChange={(e) => setDeckId(e.target.value)}
              value={deckId}
            >
              {leafDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={styles.fieldLabel}>Seconds per card</span>
            <div className={styles.radioGroup}>
              {[15, 30, 60].map((s) => (
                <button
                  key={s}
                  aria-pressed={roundSeconds === s}
                  className={styles.radioChip}
                  onClick={() => setRoundSeconds(s)}
                  type="button"
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={styles.fieldLabel}>Number of rounds</span>
            <div className={styles.radioGroup}>
              {([10, 15, 20, "unlimited"] as const).map((r) => (
                <button
                  key={String(r)}
                  aria-pressed={maxRounds === r}
                  className={styles.radioChip}
                  onClick={() => setMaxRounds(r)}
                  type="button"
                >
                  {r === "unlimited" ? "No limit" : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "var(--wt-color-danger)",
              fontSize: "0.8125rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          disabled={creating || !deckId}
          style={{
            background: "var(--wt-color-accent)",
            border: "none",
            borderRadius: "var(--wt-radius-sm)",
            color: "var(--wt-color-accentText)",
            cursor: creating ? "not-allowed" : "pointer",
            fontSize: "var(--wt-fontSize-base)",
            fontWeight: "var(--wt-fontWeight-bold)",
            height: "var(--wt-size-controlHeight)",
            opacity: creating ? 0.5 : 1,
            width: "100%",
          }}
          type="submit"
        >
          {creating ? "Creating..." : "Create room"}
        </button>
      </form>
    </div>
  );
}
