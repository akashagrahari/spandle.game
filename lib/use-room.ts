import React from "react";
import type {
  ClientMessage,
  ClientRoomState,
  ServerMessage,
} from "../types/room";

const ROOM_WORKER_URL =
  process.env.NEXT_PUBLIC_ROOM_WORKER_URL ?? "http://localhost:8787";

export function getRoomWorkerUrl(): string {
  return ROOM_WORKER_URL;
}

export interface RoomActions {
  join: (name: string, hostId?: string) => void;
  placeCard: (roundIndex: number, correct: boolean) => void;
  startGame: () => void;
  endGame: () => void;
}

export type RoomConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface UseRoomResult {
  actions: RoomActions;
  roomState: ClientRoomState | null;
  status: RoomConnectionStatus;
}

export function useRoom(code: string | null, savedPlayerId?: string | null): UseRoomResult {
  const [roomState, setRoomState] = React.useState<ClientRoomState | null>(
    null,
  );
  const [status, setStatus] = React.useState<RoomConnectionStatus>(
    "connecting",
  );
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mountedRef = React.useRef(true);
  const codeRef = React.useRef(code);
  codeRef.current = code;
  const savedPlayerIdRef = React.useRef(savedPlayerId);
  savedPlayerIdRef.current = savedPlayerId;

  const send = React.useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = React.useCallback(() => {
    const currentCode = codeRef.current;
    if (!currentCode || !mountedRef.current) return;

    const wsUrl = ROOM_WORKER_URL.replace(/^http/, "ws").replace(/\/$/, "");
    const pid = savedPlayerIdRef.current;
    const wsPath = `${wsUrl}/room/${currentCode}/ws${pid ? `?playerId=${encodeURIComponent(pid)}` : ""}`;
    const ws = new WebSocket(wsPath);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        handleServerMessage(msg);
      } catch {
        // malformed message, ignore
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      const code = codeRef.current;
      // Before retrying, check if the room still exists and is active
      reconnectTimerRef.current = setTimeout(() => {
        if (!mountedRef.current || !code) return;
        fetch(`${ROOM_WORKER_URL}/room/${code}/info`)
          .then((resp) => {
            if (!resp.ok) return; // 404/410: room gone or ended — stop retrying
            return resp.json() as Promise<{ phase: string }>;
          })
          .then((info) => {
            if (!info || info.phase === "ended") return; // room ended — stop
            if (mountedRef.current) {
              setStatus("disconnected");
              connect();
            }
          })
          .catch(() => {
            // network error — retry anyway
            if (mountedRef.current) {
              setStatus("disconnected");
              connect();
            }
          });
      }, 2000);
    };

    ws.onerror = () => {
      setStatus("error");
      ws.close();
    };

    function handleServerMessage(msg: ServerMessage) {
      switch (msg.type) {
        case "room-state":
          setRoomState(msg.state);
          break;

        case "player-joined":
          setRoomState((prev) => {
            if (!prev) return prev;
            const already = prev.players.find((p) => p.id === msg.player.id);
            if (already) {
              return {
                ...prev,
                players: prev.players.map((p) =>
                  p.id === msg.player.id ? { ...p, connected: true } : p,
                ),
              };
            }
            return {
              ...prev,
              players: [...prev.players, msg.player],
              scores: [
                ...prev.scores,
                { playerId: msg.player.id, name: msg.player.name, score: 0 },
              ],
            };
          });
          break;

        case "player-left":
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === msg.playerId ? { ...p, connected: false } : p,
              ),
            };
          });
          break;

        case "game-started":
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              phase: "playing",
              seed: msg.seed,
              deckId: msg.deckId,
              currentRound: 0,
            };
          });
          break;

        case "round-start":
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentRound: msg.roundIndex,
              deadlineTs: msg.deadlineTs,
            };
          });
          break;

        case "round-end":
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              scores: msg.scores,
              deadlineTs: null,
            };
          });
          break;

        case "game-over":
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              phase: "ended",
              scores: msg.scores,
              deadlineTs: null,
            };
          });
          break;

        case "error":
          console.error("Room error:", msg.message);
          break;
      }
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    if (code) connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [code, connect]);

  const actions: RoomActions = React.useMemo(
    () => ({
      join: (name, hostId) => send({ type: "join", name, hostId }),
      placeCard: (roundIndex, correct) =>
        send({ type: "place-card", roundIndex, correct }),
      startGame: () => send({ type: "start-game" }),
      endGame: () => send({ type: "end-game" }),
    }),
    [send],
  );

  return { actions, roomState, status };
}

export async function createRoom(opts: {
  config: { deckId: string; roundSeconds: number; maxRounds: number };
}): Promise<{ code: string; hostId: string }> {
  const resp = await fetch(`${ROOM_WORKER_URL}/room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });

  if (!resp.ok) {
    throw new Error(`Failed to create room: ${resp.status}`);
  }

  return resp.json() as Promise<{ code: string; hostId: string }>;
}
