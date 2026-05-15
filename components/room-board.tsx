import React from "react";
import { checkCorrect, drawNextCard } from "../lib/game-selection";
import { GameState } from "../types/game";
import NextItemList from "./next-item-list";
import PlayedItemList from "./played-item-list";
import RoomLeaderboard from "./room-leaderboard";
import type { ClientRoomState } from "../types/room";
import * as roomStyles from "../styles/room.css";
import * as boardStyles from "../styles/board.css";

const EDGE_SCROLL_THRESHOLD = 36;
const EDGE_SCROLL_MAX_STEP = 10;

function clampEdgeScrollProgress(p: number) {
  return Math.max(0, Math.min(1, p));
}

function useRoundTimer(deadlineTs: number | null): number {
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  React.useEffect(() => {
    if (!deadlineTs) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineTs - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [deadlineTs]);

  return secondsLeft;
}

interface Props {
  gameState: GameState;
  onEndGame: () => void;
  onPlaceCard: (correct: boolean) => void;
  onGameStateChange: (state: GameState) => void;
  roomState: ClientRoomState;
}

export default function RoomBoard({
  gameState,
  onEndGame,
  onPlaceCard,
  onGameStateChange,
  roomState,
}: Props) {
  const { deadlineTs, scores, playerId, isHost, phase, currentRound } =
    roomState;

  const [isDragging, setIsDragging] = React.useState(false);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const [locked, setLocked] = React.useState(false);
  const [deckState, setDeckState] = React.useState<
    "hidden" | "ready" | "revealing"
  >("hidden");

  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const deckAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const previewIndexRef = React.useRef<number | null>(null);
  const dragDirectionRef = React.useRef<-1 | 0 | 1>(0);
  const lastDragCentreXRef = React.useRef<number | null>(null);

  const secondsLeft = useRoundTimer(deadlineTs);
  const isUrgent = secondsLeft > 0 && secondsLeft <= 5;

  // when round advances (currentRound changes), unlock
  React.useEffect(() => {
    setLocked(false);
    setDeckState("hidden");
  }, [currentRound]);

  // reveal deck when unlocked and ready
  React.useEffect(() => {
    if (locked || gameState.next === null) return;
    const id = window.setTimeout(() => setDeckState("revealing"), 120);
    return () => window.clearTimeout(id);
  }, [locked, gameState.next]);

  React.useEffect(() => {
    if (deckState !== "revealing") return;
    const id = window.setTimeout(() => setDeckState("ready"), 760);
    return () => window.clearTimeout(id);
  }, [deckState]);

  // timer expiry — skip card
  React.useEffect(() => {
    if (locked || !deadlineTs) return;
    const remaining = deadlineTs - Date.now();
    if (remaining <= 0) {
      handleSkip();
      return;
    }
    const id = window.setTimeout(handleSkip, remaining);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineTs, locked]);

  const nextPlacementIndex = React.useMemo(() => {
    return (
      gameState.played.reduce((max, card, i) => {
        return Math.max(max, card.played.placementIndex ?? i);
      }, -1) + 1
    );
  }, [gameState.played]);

  function handleSkip() {
    if (locked) return;
    setLocked(true);

    const card = gameState.next;
    if (!card) {
      onPlaceCard(false);
      return;
    }

    // Insert the skipped card at its correct chronological position with wrong marking
    const newPlayed = [...gameState.played];
    let insertAt = newPlayed.length;
    for (let i = 0; i < newPlayed.length; i++) {
      if (newPlayed[i].durationYears > card.durationYears) {
        insertAt = i;
        break;
      }
    }
    newPlayed.splice(insertAt, 0, {
      ...card,
      played: {
        correct: false,
        justPlaced: false,
        placementIndex: nextPlacementIndex,
        showDate: true,
      },
    });

    const nextState: GameState = {
      ...gameState,
      badlyPlaced: null,
      next: gameState.nextButOne,
      nextButOne: null,
      played: newPlayed,
      usedDurations: new Set(gameState.usedDurations),
      usedQids: new Set(gameState.usedQids),
    };
    const newNextButOne = drawNextCard(nextState);
    onGameStateChange({ ...nextState, nextButOne: newNextButOne });
    onPlaceCard(false);
  }

  function getProjectedDropIndex(
    point: { x: number; y: number },
    rect?: DOMRect | null,
  ): number | null {
    const bottomEl = bottomRef.current;
    if (!bottomEl) return null;

    const bottomRect = bottomEl.getBoundingClientRect();
    const probeY = rect ? rect.top + rect.height / 2 : point.y;
    if (probeY < bottomRect.top - 100 || probeY > bottomRect.bottom + 60) {
      return null;
    }

    let probeX = point.x;
    if (rect) {
      if (dragDirectionRef.current > 0) probeX = rect.right;
      else if (dragDirectionRef.current < 0) probeX = rect.left;
      else probeX = rect.left + rect.width / 2;
    }

    const playedItemEls = Array.from(
      bottomEl.querySelectorAll<HTMLElement>("[data-card-id]"),
    );
    if (playedItemEls.length === 0) return 0;

    for (let i = 0; i < playedItemEls.length; i++) {
      const itemRect = playedItemEls[i].getBoundingClientRect();
      const threshold =
        dragDirectionRef.current > 0
          ? itemRect.left + itemRect.width * 0.75
          : dragDirectionRef.current < 0
            ? itemRect.left + itemRect.width * 0.25
            : itemRect.left + itemRect.width / 2;

      if (probeX < threshold) return i;
    }
    return playedItemEls.length;
  }

  function maybeAutoScroll(
    point: { x: number; y: number },
    rect?: DOMRect | null,
  ) {
    const bottomEl = bottomRef.current;
    if (!bottomEl) return;

    const leftEdge = rect?.left ?? point.x;
    const rightEdge = rect?.right ?? point.x;
    let delta = 0;

    if (leftEdge < EDGE_SCROLL_THRESHOLD) {
      delta = -Math.ceil(
        clampEdgeScrollProgress(1 - leftEdge / EDGE_SCROLL_THRESHOLD) *
          EDGE_SCROLL_MAX_STEP,
      );
    } else if (rightEdge > window.innerWidth - EDGE_SCROLL_THRESHOLD) {
      delta = Math.ceil(
        clampEdgeScrollProgress(
          (rightEdge - (window.innerWidth - EDGE_SCROLL_THRESHOLD)) /
            EDGE_SCROLL_THRESHOLD,
        ) * EDGE_SCROLL_MAX_STEP,
      );
    }

    if (delta === 0) return;
    bottomEl.scrollLeft = Math.max(
      0,
      Math.min(
        bottomEl.scrollWidth - bottomEl.clientWidth,
        bottomEl.scrollLeft + delta,
      ),
    );
  }

  function onCardDragStart(
    point: { x: number; y: number },
    rect: DOMRect | null,
  ) {
    if (locked) return;
    setIsDragging(true);
    dragDirectionRef.current = 0;
    lastDragCentreXRef.current = rect ? rect.left + rect.width / 2 : point.x;
    const idx = getProjectedDropIndex(point, rect);
    previewIndexRef.current = idx;
    setPreviewIndex(idx);
    navigator.vibrate?.(20);
  }

  function onCardDrop(
    point: { x: number; y: number },
    rect: DOMRect | null,
  ): boolean {
    if (locked) {
      setIsDragging(false);
      return false;
    }
    setIsDragging(false);
    const droppedIndex = getProjectedDropIndex(point, rect);
    previewIndexRef.current = null;
    setPreviewIndex(null);

    if (gameState.next === null || droppedIndex === null || rect === null) {
      return false;
    }

    const card = gameState.next;
    const newPlayed = [...gameState.played];
    const { correct, delta } = checkCorrect(newPlayed, card, droppedIndex);
    const finalIndex = correct ? droppedIndex : droppedIndex + delta;

    newPlayed.splice(finalIndex, 0, {
      ...card,
      played: {
        correct,
        justPlaced: false,
        placementIndex: nextPlacementIndex,
        showDate: true,
      },
    });

    const nextState: GameState = {
      ...gameState,
      imageCache: [],
      next: gameState.nextButOne,
      nextButOne: null,
      played: newPlayed,
      usedDurations: new Set(gameState.usedDurations),
      usedQids: new Set(gameState.usedQids),
      badlyPlaced: correct
        ? null
        : { delta, index: finalIndex, rendered: false },
    };
    const newNextButOne = drawNextCard(nextState);

    setLocked(true);
    onGameStateChange({ ...nextState, nextButOne: newNextButOne });
    onPlaceCard(correct);
    return true;
  }

  const handleDeckAnchorChange = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (deckAnchorRef.current !== node) {
        deckAnchorRef.current = node;
      }
    },
    [],
  );

  const updatePreviewIndex = React.useCallback(
    (next: number | null) => {
      if (previewIndexRef.current === next) return;
      previewIndexRef.current = next;
      setPreviewIndex(next);
    },
    [],
  );

  const roundLabel =
    phase === "playing"
      ? `Round ${currentRound + 1}`
      : phase === "ended"
        ? "Game over"
        : "";

  return (
    <div className={roomStyles.boardPage}>
      <div className={roomStyles.boardTopBar}>
        <span className={roomStyles.boardTitle}>{roundLabel}</span>
        {deadlineTs !== null && (
          <span
            className={roomStyles.timerChip}
            data-urgent={isUrgent ? "true" : "false"}
          >
            {secondsLeft}s
          </span>
        )}
        {isHost && phase === "playing" && (
          <button
            onClick={onEndGame}
            style={{
              background: "none",
              border: "none",
              color: "var(--wt-color-textMuted)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            End game
          </button>
        )}
      </div>

      <div className={roomStyles.boardContent}>
        <div
          ref={boardRef}
          className={roomStyles.boardMain}
        >
          <div className={boardStyles.top}>
            <div className={boardStyles.statusArea} />
            {gameState.next && !locked ? (
              <NextItemList
                deckAnchorRef={deckAnchorRef}
                deckState={deckState}
                next={gameState.next}
                onDeckAnchorChange={handleDeckAnchorChange}
                onCardDragMove={(point, rect) => {
                  if (rect) {
                    const cx = rect.left + rect.width / 2;
                    const last = lastDragCentreXRef.current;
                    if (last !== null) {
                      const dx = cx - last;
                      if (dx > 0.5) dragDirectionRef.current = 1;
                      else if (dx < -0.5) dragDirectionRef.current = -1;
                    }
                    lastDragCentreXRef.current = cx;
                  }
                  maybeAutoScroll(point, rect);
                  updatePreviewIndex(getProjectedDropIndex(point, rect));
                }}
                onCardDragStart={onCardDragStart}
                onCardDrop={onCardDrop}
                reserve={gameState.nextButOne}
                visible={true}
              />
            ) : null}
          </div>

          <div
            id="bottom"
            ref={bottomRef}
            className={boardStyles.bottom}
          >
            <PlayedItemList
              hiddenCardId={null}
              isDragging={isDragging}
              items={gameState.played}
              layoutAnimationsEnabled={true}
              onOpeningAnchorChange={() => {}}
              openingAnchorRef={{ current: null }}
              previewIndex={previewIndex}
            />
          </div>

          {locked && phase === "playing" && (
            <div className={roomStyles.lockedOverlay}>
              <span className={roomStyles.lockedBadge}>
                Waiting for next round...
              </span>
            </div>
          )}
        </div>

        <RoomLeaderboard myPlayerId={playerId} scores={scores} />
      </div>
    </div>
  );
}
