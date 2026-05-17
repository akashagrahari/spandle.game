import React from "react";
import { collectLeafDeckIds } from "../lib/deck-tree";
import {
  createDailyGameSnapshot,
  createDailyGameStateFromSnapshot,
  createStateWithRetry,
  filterCardsBySelectionRoute,
  resolveSelectionDeck,
} from "../lib/game-state";
import { createSeededRandom } from "../lib/seeded-random";
import type { DailyGameSnapshot } from "../types/routes";
import { playGameStart, playRoomEnd } from "../lib/sound";
import { useRoom } from "../lib/use-room";
import type { GameState } from "../types/game";
import { useDecks } from "./deck-provider";
import Loading from "./loading";
import RoomBoard from "./room-board";
import RoomFinalScreen from "./room-final-screen";
import RoomLobby from "./room-lobby";
import * as styles from "../styles/room.css";

interface Props {
  code: string;
  hostId: string | null;
}

function sessionKey(code: string) {
  return `spandle:session:${code}`;
}

function gameSnapshotKey(code: string) {
  return `spandle:gamestate:${code}`;
}

function saveRoomSnapshot(code: string, snapshot: DailyGameSnapshot) {
  try {
    sessionStorage.setItem(gameSnapshotKey(code), JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

function loadRoomSnapshot(code: string): DailyGameSnapshot | null {
  try {
    const raw = sessionStorage.getItem(gameSnapshotKey(code));
    return raw ? (JSON.parse(raw) as DailyGameSnapshot) : null;
  } catch { return null; }
}

function clearRoomSnapshot(code: string) {
  try { sessionStorage.removeItem(gameSnapshotKey(code)); } catch { /* ignore */ }
}

function readSession(code: string): { name: string; playerId: string | null } | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as { name: string; playerId: string | null };
  } catch {
    return null;
  }
}

function saveSession(code: string, name: string, playerId: string | null) {
  try {
    sessionStorage.setItem(sessionKey(code), JSON.stringify({ name, playerId }));
  } catch {
    // sessionStorage unavailable (private browsing edge cases)
  }
}

export default function RoomScreen({ code, hostId }: Props) {
  // Read sessionStorage synchronously so savedPlayerId is available before useRoom connects
  const [savedSession] = React.useState<{ name: string; playerId: string | null } | null>(
    () => readSession(code),
  );
  const [savedPlayerId, setSavedPlayerId] = React.useState<string | null>(
    () => savedSession?.playerId ?? null,
  );
  const { actions, roomState, status } = useRoom(code, savedPlayerId);
  const { deckNodes, loadDecks, rootDeckId } = useDecks();

  const [playerName, setPlayerName] = React.useState(savedSession?.name ?? "");
  const [nameSubmitted, setNameSubmitted] = React.useState(savedSession !== null);
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [gameReady, setGameReady] = React.useState(false);
  const prevPhaseRef = React.useRef<string | null>(null);

  // once we have the authoritative playerId from the server, persist the full session
  React.useEffect(() => {
    if (roomState?.playerId && playerName) {
      setSavedPlayerId(roomState.playerId);
      saveSession(code, playerName, roomState.playerId);
    }
  }, [code, roomState?.playerId, playerName]);

  // persist game state to sessionStorage on every change so refresh can restore it
  React.useEffect(() => {
    if (!gameState || !roomState?.seed) return;
    saveRoomSnapshot(code, createDailyGameSnapshot(roomState.seed, gameState));
  }, [code, gameState, roomState?.seed]);

  React.useEffect(() => {
    const phase = roomState?.phase ?? null;
    if (phase === prevPhaseRef.current) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (prev === "lobby" && phase === "playing") playGameStart();
    if (prev === "playing" && phase === "ended") playRoomEnd();
  }, [roomState?.phase]);

  // join once we have a name and the WS is connected
  React.useEffect(() => {
    if (status === "connected" && nameSubmitted && roomState === null) {
      actions.join(playerName, hostId ?? undefined);
    }
  }, [status, nameSubmitted, roomState, actions, playerName, hostId]);

  // when seed + deckId arrive, load cards and build game state
  React.useEffect(() => {
    if (
      !roomState?.seed ||
      !roomState.deckId ||
      !deckNodes ||
      !rootDeckId ||
      gameReady
    ) {
      return;
    }

    const { seed, deckId } = roomState;
    let cancelled = false;

    const prepare = async () => {
      // find the deck node
      const targetNode = deckNodes.find((n) => n.id === deckId) ?? null;
      if (!targetNode) return;

      const leafIds = collectLeafDeckIds(targetNode);
      const cardMap = await loadDecks(leafIds);

      // resolve selection deck — for room mode we use the leaf deck directly
      const selectionDeck =
        resolveSelectionDeck(deckNodes, "free-play", { kind: "leaf", nodeId: deckId }, rootDeckId) ?? targetNode;

      const filtered = filterCardsBySelectionRoute(cardMap, null);

      // restore from snapshot if available (page refresh mid-game)
      const saved = loadRoomSnapshot(code);
      if (saved && saved.dateKey === seed) {
        if (!cancelled) {
          setGameState(createDailyGameStateFromSnapshot(saved, selectionDeck, filtered));
          setGameReady(true);
        }
        return;
      }

      const random = createSeededRandom(seed);

      const state = await createStateWithRetry(selectionDeck, filtered, "easy", {
        random,
      });

      if (cancelled) return;

      // auto-place the anchor card (first card)
      if (state.next) {
        const anchor = state.next;
        const promoted = state.nextButOne;
        const anchoredState: GameState = {
          ...state,
          next: promoted,
          nextButOne: null,
          played: [
            {
              ...anchor,
              played: {
                correct: true,
                justPlaced: false,
                placementIndex: 0,
                showDate: true,
              },
            },
          ],
          usedDurations: new Set(state.usedDurations),
          usedQids: new Set(state.usedQids),
        };
        // draw nextButOne
        const { drawNextCard } = await import("../lib/game-selection");
        const roundRandom = createSeededRandom(`${seed}:${anchoredState.played.length}`);
        const nextButOne = drawNextCard({ ...anchoredState, random: roundRandom });
        setGameState({ ...anchoredState, nextButOne });
      } else {
        setGameState(state);
      }

      setGameReady(true);
    };

    void prepare();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.seed, roomState?.deckId, deckNodes, rootDeckId, gameReady]);

  // reset game state when a new game starts
  React.useEffect(() => {
    if (roomState?.phase === "lobby") {
      setGameReady(false);
      setGameState(null);
      clearRoomSnapshot(code);
    }
  }, [roomState?.phase, code]);

  function handlePlaceCard(correct: boolean) {
    if (!roomState) return;
    // if it's the end-game button we treat it as endGame
    actions.placeCard(roomState.currentRound, correct);
  }

  // ---- Name entry ----
  if (!nameSubmitted) {
    return (
      <div className={styles.namePage}>
        <form
          className={styles.card}
          onSubmit={(e) => {
            e.preventDefault();
            if (playerName.trim()) {
              saveSession(code, playerName.trim(), null);
              setNameSubmitted(true);
            }
          }}
        >
          <div className={styles.heading}>Join room {code}</div>
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.fieldLabel} htmlFor="player-name">
                Your name
              </label>
              <input
                autoFocus
                className={styles.fieldInput}
                id="player-name"
                maxLength={24}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
                type="text"
                value={playerName}
              />
            </div>
          </div>
          <button
            disabled={!playerName.trim()}
            style={{
              background: "var(--wt-color-accent)",
              border: "none",
              borderRadius: "var(--wt-radius-sm)",
              color: "var(--wt-color-accentText)",
              cursor: playerName.trim() ? "pointer" : "not-allowed",
              fontSize: "var(--wt-fontSize-base)",
              fontWeight: "var(--wt-fontWeight-bold)",
              height: "var(--wt-size-controlHeight)",
              opacity: playerName.trim() ? 1 : 0.5,
              width: "100%",
            }}
            type="submit"
          >
            Join
          </button>
        </form>
      </div>
    );
  }

  // ---- Loading ----
  if (status === "connecting" || !roomState) {
    return (
      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: "100dvh",
          justifyContent: "center",
        }}
      >
        <Loading />
      </div>
    );
  }

  if (status === "error" || status === "disconnected") {
    return (
      <div className={styles.namePage}>
        <div className={styles.card}>
          <div className={styles.heading}>Connection lost</div>
          <p style={{ color: "var(--wt-color-textMuted)", margin: 0 }}>
            Trying to reconnect...
          </p>
        </div>
      </div>
    );
  }

  // ---- Game over ----
  if (roomState.phase === "ended") {
    return (
      <RoomFinalScreen
        myPlayerId={roomState.playerId}
        scores={roomState.scores}
      />
    );
  }

  // ---- Lobby ----
  if (roomState.phase === "lobby") {
    return (
      <RoomLobby
        onStart={() => actions.startGame()}
        roomState={roomState}
      />
    );
  }

  // ---- Playing ----
  if (!gameReady || !gameState) {
    return (
      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: "100dvh",
          justifyContent: "center",
        }}
      >
        <Loading />
      </div>
    );
  }

  return (
    <RoomBoard
      gameState={gameState}
      onEndGame={() => actions.endGame()}
      onGameStateChange={setGameState}
      onPlaceCard={handlePlaceCard}
      roomState={roomState}
    />
  );
}
