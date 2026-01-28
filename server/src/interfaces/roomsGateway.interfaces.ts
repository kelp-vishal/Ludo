export interface IGameRoom {
  roomId: string;
  players: IPlayers[];
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
  hostSocketId: string;
  createdAt: Date;
}

export interface IData {
  playerCount: number;
  playerName: string;
  socketId: string;
  roomId: string;
}

export interface IPlayers {
  socketId: string;
  playerName?: string;
  color?: string;
}
