import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IPiece,
  IPieceMovedEvent,
} from '../../interfaces/ludoboard.interfaces';
import { IGameState } from '../../interfaces/ludoboard.interfaces';
import { GameService } from '../services/game.service';
import { SocketService } from '../services/socket.service';
import { RoomService } from '../services/room.service';
import { Subscription } from 'rxjs';
import { IGameStateUpdate } from '../../interfaces/ludoboard.interfaces';

@Component({
  selector: 'app-ludo-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ludo-board.component.html',
  styleUrls: ['./ludo-board.component.css'],
})
export class LudoBoardComponent implements OnInit, OnDestroy {
  Math = Math;
  turnOrder = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  valueDice = signal(1);

  pieces: IPiece[] = [];
  gameState: IGameState | null = null;
  gridCells = Array(225).fill(0);

  gameService = inject(GameService);
  socketService = inject(SocketService);
  roomService = inject(RoomService);

  pieces$ = this.gameService.pieces$;
  currentRoom$ = this.roomService.currentRoom$;
  players$ = this.roomService.players$;

  private subscriptions: Subscription[] = [];

  isRolling = false;

  ngOnInit(): void {
    // Subscribe to gameState changes
    const gameStateSubscription = this.gameService.gameState$.subscribe(
      (state) => {
        this.gameState = state;
      },
    );

    // Subscribe to dice rolled event from server
    const diceRolledSubscription = this.socketService.diceRolled$.subscribe(
      (data) => {
        if (data) {
          this.valueDice.set(data.diceValue);
          // Update full game state from server
          if (data.gameState) {
            this.gameService.updateGameState(data.gameState);

            // Auto-move if only one piece is movable
            if (data.gameState.movablePieces?.length === 1 && this.isMyTurn()) {
              const pieceId = data.gameState.movablePieces[0];
              setTimeout(() => {
                this.selectPiece(pieceId);
              }, 500);
            }
          }
        }
      },
    );

    // Subscribe to piece moved event from server
    const pieceMovedSubscription = this.socketService.pieceMoved$.subscribe(
      (data) => {
        if (data) {
          this.animatePieceMovement(data);
        }
      },
    );

    // Subscribe to turn changed event from server
    const turnChangedSubscription = this.socketService.turnChanged$.subscribe(
      (data) => {
        if (data && data.gameState) {
          this.gameService.updateGameState(data.gameState);
        }
      },
    );

    // Subscribe to game won event from server
    const gameWonSubscription = this.socketService.gameWon$.subscribe(
      (data) => {
        if (data) {
          // this.gameService.updateGameState({ gameWon: data.winner });
        }
      },
    );

    this.subscriptions.push(
      gameStateSubscription,
      diceRolledSubscription,
      pieceMovedSubscription,
      turnChangedSubscription,
      gameWonSubscription,
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getCurrentPlayerName(): string {
    const currentColor = this.gameService.getCurrentPlayer();
    const currentRoom = this.roomService.getCurrentRoom();

    if (!currentRoom || !currentColor) {
      return currentColor || 'Player';
    }

    const player = currentRoom.players.find((p) => p.color === currentColor);
    return player?.playerName || currentColor;
  }

  rollDice(): void {
    if (!this.gameState?.gameWon && this.isMyTurn()) {
      const currentRoom = this.roomService.getCurrentRoom();
      if (!currentRoom) {
        return;
      }

      this.isRolling = true;

      // Request dice roll from server
      this.socketService.rollDice(currentRoom.roomId);

      setTimeout(() => {
        this.isRolling = false;
      }, 800);
    }
  }

  async selectPiece(pieceId: string): Promise<void> {
    const myColor = this.gameService.getMyColor();
    const pieceColor = pieceId.split('_')[0];

    if (pieceColor !== myColor) {
      return;
    }

    if (!this.gameState?.movablePieces.includes(pieceId)) {
      return;
    }

    const currentRoom = this.roomService.getCurrentRoom();
    if (!currentRoom) {
      return;
    }

    // Send move request to server
    this.socketService.movePiece(currentRoom.roomId, pieceId);
  }

  private async animatePieceMovement(data: IPieceMovedEvent): Promise<void> {
    if (!this.gameState) {
      return;
    }

    const { pieceId, oldPosition, newPosition, steps, killedPieceId } = data;

    // Animate piece movement step by step
    if (steps && steps.length > 0) {
      for (const step of steps) {
        this.gameState.pieces[pieceId] = step;
        this.gameService.syncUiPieces();
        await this.delay(400);
      }
    } else {
      this.gameState.pieces[pieceId] = newPosition;
      this.gameService.syncUiPieces();
    }

    // Handle killed piece animation
    if (killedPieceId) {
      const killedPos = this.gameState.pieces[killedPieceId];
      if (killedPos >= 0) {
        // Animate piece going home
        for (let pos = killedPos - 1; pos >= 0; pos--) {
          this.gameState.pieces[killedPieceId] = pos;
          this.gameService.syncUiPieces();
          await this.delay(50);
        }
      }
      this.gameState.pieces[killedPieceId] = -1;
      this.gameService.syncUiPieces();
    }

    // Update game state from server
    if (data.gameState) {
      this.gameService.updateGameState(data.gameState);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getPieceScale(piece: IPiece): number {
    // Count how many pieces are at the same position
    const pieces = this.gameService.pieces || [];
    const samePosition = pieces.filter(
      (p) =>
        p.currentX === piece.currentX &&
        p.currentY === piece.currentY &&
        p.position >= 0,
    ).length;

    // Scale down if multiple pieces at same position
    return samePosition > 1 ? 0.7 : 1;
  }

  getPieceOffset(piece: IPiece): { x: number; y: number } {
    const pieces = this.gameService.pieces || [];
    const samePosArray = pieces.filter(
      (p) =>
        p.currentX === piece.currentX &&
        p.currentY === piece.currentY &&
        p.position >= 0,
    );

    if (samePosArray.length <= 1) {
      return { x: 0, y: 0 };
    }

    const index = samePosArray.findIndex((p) => p.id === piece.id);
    const offset = 8;

    // Offset pieces in a circular pattern
    return {
      x: index * offset,
      y: index * offset,
    };
  }

  IsRedTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'RED'.toLowerCase();
  }
  IsBlueTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'BLUE'.toLowerCase();
  }
  IsYellowTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'YELLOW'.toLowerCase();
  }
  IsGreenTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'GREEN'.toLowerCase();

    // return this.gameService.isRedTurn();
  }

  getVisiblePieces(): IPiece[] {
    return this.gameService.getVisiblePieces();
  }

  getCurrentPlayer(): string {
    return this.gameService.getCurrentPlayer();
  }

  isGameWon(): string | null {
    return this.gameService.gameState.gameWon;
  }

  isMyTurn(): boolean {
    const currentPlayer = this.gameService.getCurrentPlayer();
    const myColor = this.gameService.getMyColor();
    return currentPlayer === myColor;
  }

  isMyPiece(piece: IPiece): boolean {
    const myColor = this.gameService.getMyColor();
    return piece.color === myColor.toLowerCase();
  }

  isRedHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 9 && row <= 15 && col <= 5 && col >= 0;
  }

  isYellowHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 9 && row <= 14 && col >= 9;
  }

  isGreenHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 0 && row <= 5 && col >= 9;
  }

  isBlueHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 0 && row <= 5 && col <= 5;
  }

  isRedBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 9 && col <= 5 && col >= 0) ||
      (row === 14 && col <= 5 && col >= 0) ||
      (col === 0 && row >= 9 && row <= 15) ||
      (col === 5 && row >= 9 && row <= 15)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isYellowBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 9 && col >= 9) ||
      (row === 14 && col >= 9) ||
      (col === 9 && row >= 9) ||
      (col === 14 && row >= 9)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isBlueBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    if (
      (row === 0 && col >= 0 && col <= 5) ||
      (row === 5 && col >= 0 && col <= 5) ||
      (col === 0 && row <= 5 && row >= 0) ||
      (col === 5 && row <= 5 && row >= 0)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isGreenBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 0 && col >= 9) ||
      (row === 5 && col >= 9) ||
      (col === 9 && row <= 5) ||
      (col === 14 && row <= 5)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isSafeZone(index: number): boolean {
    const safeIndices = [122, 188, 36, 102, 201, 133, 23, 91];
    return safeIndices.includes(index);
  }

  // isStartZone(index: number): boolean {
  //   const startIndices = [201, 23, 91, 133];
  //   return startIndices.includes(index);
  // }
  isFinishZone(index: number): boolean {
    const finishIndices = [96, 97, 98, 111, 113, 112, 128, 127, 126];
    return finishIndices.includes(index);
  }

  isRedPath(index: number): boolean {
    const val = [201, 202, 187, 172, 157, 142];
    return val.includes(index);
  }
  isYellowPath(index: number): boolean {
    const val = [133, 118, 117, 116, 115, 114];
    return val.includes(index);
  }
  isGreenPath(index: number): boolean {
    const val = [23, 22, 37, 52, 67, 82];
    return val.includes(index);
  }
  isBluePath(index: number): boolean {
    const val = [91, 106, 107, 108, 109, 110];
    return val.includes(index);
  }

  isBaseAll(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 10 && col === 1) ||
      (row === 10 && col === 4) ||
      (row === 13 && col === 1) ||
      (row === 13 && col === 4) ||
      (row === 1 && col === 1) ||
      (row === 1 && col === 4) ||
      (row === 4 && col === 1) ||
      (row === 4 && col === 4) ||
      (row === 1 && col === 10) ||
      (row === 1 && col === 13) ||
      (row === 4 && col === 10) ||
      (row === 4 && col === 13) ||
      (row === 10 && col === 10) ||
      (row === 10 && col === 13) ||
      (row === 13 && col === 10) ||
      (row === 13 && col === 13)
    ) {
      return true;
    } else {
      return false;
    }
  }
}
