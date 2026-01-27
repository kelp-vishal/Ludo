export interface IPiece {
  id: string;
  color: string;
  position: number;
  currentX: number;
  currentY: number;
}

export interface IGameState {
  activePlayers: string[];
  currentTurn: number;
  diceValue: number;
  pieces: { [pieceId: string]: number };
  gameWon: string | null;
  movablePieces: string[];
  timestamp: Date;
  room: string | null;
}

export interface IAvailableRoom {
  roomId: string;
  players: Array<{ socketId: string; color?: string; playerName?: string }>;
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
}
export interface IGameStateUpdate {
  currentTurn: number;
  diceValue: number;
  pieces: { [pieceId: string]: number };
  movablePieces: string[];
  timestamp: Date;
  lastMove?: {
    pieceId: string;
    fromPos: number;
    toPos: number;
  };
}

export interface IDiceRolledEvent {
  diceValue: number;
  movablePieces: string[];
  currentPlayer: string;
  gameState: IGameState;
  rolledBy: string;
}

export interface IPieceMovedEvent {
  pieceId: string;
  oldPosition: number;
  newPosition: number;
  steps: number[];
  killedPieceId: string | null;
  gameState: IGameState;
  movedBy: string;
}

export interface ITurnChangedEvent {
  gameState: IGameState;
  message?: string;
}

export interface IGameWonEvent {
  winner: string;
  gameState: IGameState;
}

export interface IGameStartedEvent {
  room: IAvailableRoom;
  gameState: IGameState;
  message: string;
  players: Array<{ socketId: string; color?: string; playerName?: string }>;
}
