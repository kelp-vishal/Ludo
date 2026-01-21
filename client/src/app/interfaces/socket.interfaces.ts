export interface IRoom {
  roomId: string;
  players: Array<{ socketId: string; color?: string }>;
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
}