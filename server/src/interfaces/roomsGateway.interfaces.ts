export interface IGameRoom {
  roomId: string;
  players: Array<{socketId: string;playerName?: string; color?: string }>;
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
  hostSocketId: string;
  createdAt: Date;
}