export interface RoomConfig {
  deckId: string;
  roundSeconds: number;
  maxRounds: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  connected: boolean;
}

export interface PlayerScore {
  playerId: string;
  name: string;
  score: number;
}

export type RoomPhase = "lobby" | "playing" | "ended";

export interface ClientRoomState {
  code: string;
  config: RoomConfig;
  currentRound: number;
  deadlineTs: number | null;
  deckId: string | null;
  hostId: string;
  isHost: boolean;
  phase: RoomPhase;
  playerId: string;
  players: PlayerInfo[];
  scores: PlayerScore[];
  seed: string | null;
}

export type ServerMessage =
  | { type: "room-state"; state: ClientRoomState }
  | { type: "player-joined"; player: PlayerInfo }
  | { type: "player-left"; playerId: string }
  | { type: "game-started"; seed: string; deckId: string }
  | { type: "round-start"; roundIndex: number; deadlineTs: number }
  | { type: "round-end"; roundIndex: number; scores: PlayerScore[] }
  | { type: "game-over"; scores: PlayerScore[] }
  | { type: "error"; message: string };

export type ClientMessage =
  | { type: "join"; name: string; hostId?: string }
  | { type: "place-card"; roundIndex: number; correct: boolean }
  | { type: "start-game" }
  | { type: "end-game" };
