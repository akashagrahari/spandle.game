import React from "react";
import { collectLeafDeckIds } from "../lib/deck-tree";
import {
  createStateWithRetry,
  filterCardsBySelectionRoute,
  resolveSelectionDeck,
} from "../lib/game-state";
import { createSeededRandom } from "../lib/seeded-random";
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

export default function RoomScreen({ code, hostId }: Props) {
  const { actions, roomState, status } = useRoom(code);
  const { deckNodes, loadDecks, rootDeckId } = useDecks();

  const [playerName, setPlayerName] = React.useState("");
  const [nameSubmitted, setNameSubmitted] = React.useState(false);
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [gameReady, setGameReady] = React.useState(false);

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
        const nextButOne = drawNextCard(anchoredState);
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
    }
  }, [roomState?.phase]);

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
            if (playerName.trim()) setNameSubmitted(true);
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
