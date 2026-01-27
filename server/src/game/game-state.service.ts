import { Injectable } from '@nestjs/common';
import { IPieceState } from './game-logic.service';

export interface IGameState {
  roomId: string;
  activePlayers: string[];
  currentTurn: number;
  diceValue: number;
  pieces: IPieceState;
  gameWon: string | null;
  movablePieces: string[];
  timestamp: Date;
}

@Injectable()
export class GameStateService {
  private gameStates: Map<string, IGameState> = new Map();

  initializeGame(roomId: string, playerColors: string[]): IGameState {
    const pieces: IPieceState = {};

    // Initialize all pieces to home position (-1)
    playerColors.forEach((color) => {
      for (let i = 0; i < 4; i++) {
        pieces[`${color}_${i}`] = -1;
      }
    });

    const gameState: IGameState = {
      roomId,
      activePlayers: playerColors,
      currentTurn: 0,
      diceValue: 0,
      pieces,
      gameWon: null,
      movablePieces: [],
      timestamp: new Date(),
    };

    this.gameStates.set(roomId, gameState);
    return gameState;
  }

  getGameState(roomId: string): IGameState | undefined {
    return this.gameStates.get(roomId);
  }

  updateGameState(roomId: string, updates: Partial<IGameState>): IGameState {
    const currentState = this.gameStates.get(roomId);
    if (!currentState) {
      throw new Error(`Game state not found for room ${roomId}`);
    }

    const updatedState = {
      ...currentState,
      ...updates,
      timestamp: new Date(),
    };

    this.gameStates.set(roomId, updatedState);
    return updatedState;
  }

  updatePiecePosition(
    roomId: string,
    pieceId: string,
    position: number,
  ): IGameState {
    const currentState = this.gameStates.get(roomId);
    if (!currentState) {
      throw new Error(`Game state not found for room ${roomId}`);
    }

    currentState.pieces[pieceId] = position;
    currentState.timestamp = new Date();

    this.gameStates.set(roomId, currentState);
    return currentState;
  }

  deleteGameState(roomId: string): void {
    this.gameStates.delete(roomId);
  }

  getCurrentPlayer(roomId: string): string | null {
    const state = this.gameStates.get(roomId);
    if (!state) return null;

    return state.activePlayers[state.currentTurn] || null;
  }

  nextTurn(roomId: string): IGameState {
    const currentState = this.gameStates.get(roomId);
    if (!currentState) {
      throw new Error(`Game state not found for room ${roomId}`);
    }

    currentState.currentTurn =
      (currentState.currentTurn + 1) % currentState.activePlayers.length;
    currentState.diceValue = 0;
    currentState.movablePieces = [];
    currentState.timestamp = new Date();

    this.gameStates.set(roomId, currentState);
    return currentState;
  }

  setWinner(roomId: string, color: string): IGameState {
    return this.updateGameState(roomId, { gameWon: color });
  }

  removePlayer(roomId: string, color: string): IGameState | undefined {
    const currentState = this.gameStates.get(roomId);
    if (!currentState) {
      return undefined;
    }

    // Remove player's color from active players
    const playerIndex = currentState.activePlayers.indexOf(color);
    if (playerIndex === -1) {
      return currentState;
    }

    currentState.activePlayers = currentState.activePlayers.filter(
      (c) => c !== color,
    );

    // Adjust current turn
    if (
      currentState.currentTurn >= playerIndex &&
      currentState.currentTurn > 0
    ) {
      currentState.currentTurn = Math.max(0, currentState.currentTurn - 1);
    }

    // Ensure turn is within bounds
    if (currentState.activePlayers.length > 0) {
      currentState.currentTurn =
        currentState.currentTurn % currentState.activePlayers.length;
    } else {
      currentState.currentTurn = 0;
    }

    // Remove player's pieces from the game
    Object.keys(currentState.pieces).forEach((pieceId) => {
      if (pieceId.startsWith(color)) {
        delete currentState.pieces[pieceId];
      }
    });

    currentState.timestamp = new Date();
    this.gameStates.set(roomId, currentState);

    return currentState;
  }

  getAllGameStates(): Map<string, IGameState> {
    return this.gameStates;
  }
}
