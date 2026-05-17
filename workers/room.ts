import type {
  ClientMessage,
  ClientRoomState,
  PlayerInfo,
  PlayerScore,
  RoomConfig,
  RoomPhase,
  ServerMessage,
} from "../types/room";

interface StoredRoomState {
  code: string;
  config: RoomConfig;
  currentRound: number;
  deadlineTs: number | null;
  hostId: string;    // current WS playerId of the host — updated on each (re)connect
  hostToken: string; // static secret from room creation — used to verify reconnects
  pendingAlarm: "round-start" | "round-end" | null;
  phase: RoomPhase;
  players: StoredPlayer[];
  scores: Record<string, number>;
  seed: string;
}

interface StoredPlayer {
  id: string;
  name: string;
  lockedThisRound: boolean;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateSeed(): string {
  return Math.floor(Math.random() * 2 ** 32).toString();
}

export class RoomDO {
  private state: DurableObjectState;
  private roomState: StoredRoomState | null = null;
  private loaded = false;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async loadState(): Promise<void> {
    // always reload — in-memory state is lost when the DO hibernates between messages
    this.roomState =
      (await this.state.storage.get<StoredRoomState>("room")) ?? null;
    this.loaded = true;
  }

  private async saveState(): Promise<void> {
    if (this.roomState) {
      await this.state.storage.put("room", this.roomState);
    }
  }

  private broadcast(message: ServerMessage, excludeId?: string): void {
    const json = JSON.stringify(message);
    for (const ws of this.state.getWebSockets()) {
      const tags = this.state.getTags(ws);
      if (tags[0] !== excludeId) {
        try {
          ws.send(json);
        } catch {
          // connection dead, webSocketClose will handle cleanup
        }
      }
    }
  }

  private sendTo(playerId: string, message: ServerMessage): void {
    const json = JSON.stringify(message);
    for (const ws of this.state.getWebSockets()) {
      if (this.state.getTags(ws)[0] === playerId) {
        try {
          ws.send(json);
        } catch {
          // ignore
        }
      }
    }
  }

  private toPlayerInfo(player: StoredPlayer, connected: boolean): PlayerInfo {
    return { id: player.id, name: player.name, connected };
  }

  private getConnectedIds(): Set<string> {
    const ids = new Set<string>();
    for (const ws of this.state.getWebSockets()) {
      ids.add(this.state.getTags(ws)[0]);
    }
    return ids;
  }

  private buildClientState(
    playerId: string,
    room: StoredRoomState,
  ): ClientRoomState {
    const connectedIds = this.getConnectedIds();
    return {
      code: room.code,
      config: room.config,
      currentRound: room.currentRound,
      deadlineTs: room.deadlineTs ?? null,
      deckId: room.phase !== "lobby" ? room.config.deckId : null,
      hostId: room.hostId,
      isHost: playerId === room.hostId,
      phase: room.phase,
      playerId,
      players: room.players.map((p) =>
        this.toPlayerInfo(p, connectedIds.has(p.id)),
      ),
      scores: room.players.map((p) => ({
        playerId: p.id,
        name: p.name,
        score: room.scores[p.id] ?? 0,
      })),
      seed: room.phase !== "lobby" ? room.seed : null,
    };
  }

  private checkAdvanceRound(): void {
    if (!this.roomState || this.roomState.phase !== "playing") return;
    const connectedIds = this.getConnectedIds();
    const activePlayers = this.roomState.players.filter((p) =>
      connectedIds.has(p.id),
    );
    const allLocked = activePlayers.every((p) => p.lockedThisRound);
    if (allLocked && activePlayers.length > 0) {
      void this.endRound();
    }
  }

  private async endRound(): Promise<void> {
    if (!this.roomState || this.roomState.phase !== "playing") return;

    this.roomState.deadlineTs = null;

    const scores: PlayerScore[] = this.roomState.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      score: this.roomState!.scores[p.id] ?? 0,
    }));

    this.broadcast({
      type: "round-end",
      roundIndex: this.roomState.currentRound,
      scores,
    });

    const maxRounds = this.roomState.config.maxRounds;
    const nextRound = this.roomState.currentRound + 1;

    if (maxRounds > 0 && nextRound >= maxRounds) {
      await this.endGame();
      return;
    }

    // unlock all players for next round
    for (const player of this.roomState.players) {
      player.lockedThisRound = false;
    }
    this.roomState.currentRound = nextRound;
    this.roomState.pendingAlarm = "round-start";
    await this.saveState();

    // brief buffer before revealing next card, then alarm fires startRound()
    await this.state.storage.setAlarm(Date.now() + 4000);
  }

  private async endGame(): Promise<void> {
    if (!this.roomState) return;
    this.roomState.phase = "ended";
    await this.saveState();
    const scores: PlayerScore[] = this.roomState.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      score: this.roomState!.scores[p.id] ?? 0,
    }));
    this.broadcast({ type: "game-over", scores });
  }

  async alarm(): Promise<void> {
    await this.loadState();
    if (!this.roomState || this.roomState.phase !== "playing") return;

    const purpose = this.roomState.pendingAlarm;
    this.roomState.pendingAlarm = null;

    if (purpose === "round-start") {
      await this.startRound();
    } else if (purpose === "round-end") {
      // timer expired — lock everyone who hasn't placed and end the round
      for (const player of this.roomState.players) {
        player.lockedThisRound = true;
      }
      await this.endRound();
    }
  }

  private async startRound(): Promise<void> {
    if (!this.roomState) return;
    const deadlineTs = Date.now() + this.roomState.config.roundSeconds * 1000;
    this.roomState.deadlineTs = deadlineTs;
    this.roomState.pendingAlarm = "round-end";
    await this.saveState();
    await this.state.storage.setAlarm(deadlineTs);
    this.broadcast({
      type: "round-start",
      roundIndex: this.roomState.currentRound,
      deadlineTs,
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      url.pathname.endsWith("/ws") === false &&
      url.pathname.endsWith("/info") === false
    ) {
      // POST /room/:code/init — initialise room state
      await this.loadState();
      if (this.roomState) {
        return new Response(JSON.stringify({ error: "Room already exists" }), {
          status: 409,
          headers: corsHeaders(),
        });
      }

      const body = (await request.json()) as {
        code: string;
        config: RoomConfig;
        hostId: string;
      };

      this.roomState = {
        code: body.code,
        config: body.config,
        currentRound: 0,
        deadlineTs: null,
        hostId: "",
        hostToken: body.hostId,
        pendingAlarm: null,
        phase: "lobby",
        players: [],
        scores: {},
        seed: generateSeed(),
      };
      await this.saveState();

      return new Response(
        JSON.stringify({ ok: true, seed: this.roomState.seed }),
        { headers: corsHeaders() },
      );
    }

    if (url.pathname.endsWith("/info")) {
      await this.loadState();
      if (!this.roomState) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: corsHeaders(),
        });
      }
      return new Response(
        JSON.stringify({ phase: this.roomState.phase, code: this.roomState.code }),
        { headers: corsHeaders() },
      );
    }

    // WebSocket upgrade
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    await this.loadState();
    if (!this.roomState) {
      return new Response("Room not found", { status: 404 });
    }
    if (this.roomState.phase === "ended") {
      return new Response("Room has ended", { status: 410 });
    }

    const rejoinId = url.searchParams.get("playerId");
    const playerId =
      rejoinId && this.roomState.players.some((p) => p.id === rejoinId)
        ? rejoinId
        : crypto.randomUUID();
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server, [playerId]);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    await this.loadState();
    if (!this.roomState) return;
    const [playerId] = this.state.getTags(ws);
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(ws, playerId, msg.name, msg.hostId);
        break;
      case "place-card":
        this.handlePlaceCard(playerId, msg.roundIndex, msg.correct);
        break;
      case "start-game":
        this.handleStartGame(playerId);
        break;
      case "end-game":
        this.handleEndGame(playerId);
        break;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.loadState();
    if (!this.roomState) return;
    const [playerId] = this.state.getTags(ws);
    this.broadcast({ type: "player-left", playerId });
    this.checkAdvanceRound();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  private handleJoin(
    ws: WebSocket,
    playerId: string,
    name: string,
    hostId?: string,
  ): void {
    if (!this.roomState) return;

    // if the player presents the host token, promote their current WS playerId to hostId
    if (hostId && hostId === this.roomState.hostToken) {
      this.roomState.hostId = playerId;
    }

    const existingPlayer = this.roomState.players.find(
      (p) => p.id === playerId,
    );

    if (!existingPlayer) {
      const newPlayer: StoredPlayer = {
        id: playerId,
        name: name.trim().slice(0, 24) || "Player",
        lockedThisRound: false,
      };
      this.roomState.players.push(newPlayer);
      if (!this.roomState.scores[playerId]) {
        this.roomState.scores[playerId] = 0;
      }
      this.broadcast({ type: "player-joined", player: this.toPlayerInfo(newPlayer, true) }, playerId);
    }

    const clientState = this.buildClientState(playerId, this.roomState);
    ws.send(JSON.stringify({ type: "room-state", state: clientState } as ServerMessage));

    void this.saveState();
  }

  private handlePlaceCard(
    playerId: string,
    roundIndex: number,
    correct: boolean,
  ): void {
    if (!this.roomState || this.roomState.phase !== "playing") return;
    if (roundIndex !== this.roomState.currentRound) return;

    const player = this.roomState.players.find((p) => p.id === playerId);
    if (!player || player.lockedThisRound) return;

    player.lockedThisRound = true;
    if (correct) {
      this.roomState.scores[playerId] =
        (this.roomState.scores[playerId] ?? 0) + 1;
    }

    void this.saveState().then(() => {
      this.checkAdvanceRound();
    });
  }

  private handleStartGame(playerId: string): void {
    if (!this.roomState) return;
    if (playerId !== this.roomState.hostId) return;
    if (this.roomState.phase !== "lobby") return;
    if (this.roomState.players.length === 0) return;

    this.roomState.phase = "playing";
    this.roomState.currentRound = 0;

    void this.saveState().then(async () => {
      if (!this.roomState) return;
      this.broadcast({
        type: "game-started",
        seed: this.roomState.seed,
        deckId: this.roomState.config.deckId,
      });
      await this.startRound();
    });
  }

  private handleEndGame(playerId: string): void {
    if (!this.roomState) return;
    if (playerId !== this.roomState.hostId) return;
    void this.endGame();
  }
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // Expected paths:
    //   POST /room           — create room
    //   GET  /room/:code/ws  — websocket
    //   GET  /room/:code/info — phase info

    if (parts[0] !== "room") {
      return new Response("Not found", { status: 404 });
    }

    if (parts.length === 1 && request.method === "POST") {
      // Create a new room
      const body = (await request.json()) as {
        config: RoomConfig;
        hostName: string;
      };

      let code: string;
      let attempts = 0;

      // find an unused code (very unlikely to collide, but be safe)
      do {
        code = generateRoomCode();
        attempts++;
      } while (attempts < 5);

      const hostId = crypto.randomUUID();
      const doId = env.ROOM.idFromName(code);
      const stub = env.ROOM.get(doId);

      const initResp = await stub.fetch(
        new Request(`https://do/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, config: body.config, hostId }),
        }),
      );

      if (!initResp.ok) {
        return new Response(JSON.stringify({ error: "Failed to create room" }), {
          status: 500,
          headers: corsHeaders(),
        });
      }

      return new Response(JSON.stringify({ code, hostId }), {
        headers: corsHeaders(),
      });
    }

    if (parts.length >= 2) {
      const code = parts[1].toUpperCase();
      const doId = env.ROOM.idFromName(code);
      const stub = env.ROOM.get(doId);

      if (parts[2] === "info") {
        return stub.fetch(
          new Request(`https://do/info`, { method: "GET" }),
        );
      }

      if (parts[2] === "ws" || request.headers.get("Upgrade") === "websocket") {
        return stub.fetch(request);
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

interface Env {
  ROOM: DurableObjectNamespace;
}
