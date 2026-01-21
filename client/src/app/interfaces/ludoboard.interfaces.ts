export interface IPiece {
  id: string;
  color: string;
  position: number;
  currentX: number;
  currentY: number;
}

// export interface IGameState {
//   currentTurn: string;
//   diceValue: number;
//   movablePieces: string[];
//   pieces: { [key: string]: { position: number } };
// }

export interface IGameState { 
  activePlayers: string[];
  currentTurn: number;
  diceValue: number;
  pieces: { [pieceId: string]: number };
  // pieces:IPiece;
  gameWon: string | null;
  movablePieces: string[];
}

export interface IAvailableRoom {
  roomId: string;
  players: Array<{socketId:string; color?:string;playerName?: string }>;
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
}