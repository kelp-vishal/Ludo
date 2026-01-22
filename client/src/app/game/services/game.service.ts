import { Injectable } from '@angular/core';
import { IGameState, IPiece } from '../../interfaces/ludoboard.interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  gameState: IGameState = {
    activePlayers: [],
    currentTurn: 0,
    diceValue: 0,
    pieces: {},
    gameWon: null,
    movablePieces: [],
  };

  private myColor: string = 'RED';
  private isAnimating = false;
  private piecesSubject = new BehaviorSubject<IPiece[]>([]);
  pieces$ = this.piecesSubject.asObservable();

  private gameStateSubject = new BehaviorSubject<IGameState>(this.gameState);
  gameState$ = this.gameStateSubject.asObservable();
  pieces: IPiece[] = [];
  initPieces() {
    //for active player use loop for each color and push to pieces array

    const newPieces: IPiece[] = [];
    this.gameState.activePlayers.forEach((player) => {
      // const color = this.gameState.activePlayers[activePlayer];
      if (player.includes('RED')) {
        newPieces.push(
          {
            id: 'RED_0',
            color: 'red',
            position: -1,
            currentX: 40,
            currentY: 400,
          },
          // {id: 'RED_0', color:'red', position: -1, currentX: 40, currentY: 240},
          {
            id: 'RED_1',
            color: 'red',
            position: -1,
            currentX: 40,
            currentY: 520,
          },
          {
            id: 'RED_2',
            color: 'red',
            position: -1,
            currentX: 160,
            currentY: 400,
          },
          {
            id: 'RED_3',
            color: 'red',
            position: -1,
            currentX: 160,
            currentY: 520,
          },
        );
      } else if (player.includes('YELLOW')) {
        newPieces.push(
          {
            id: 'YELLOW_0',
            color: 'yellow',
            position: -1,
            currentX: 400,
            currentY: 400,
          },
          {
            id: 'YELLOW_1',
            color: 'yellow',
            position: -1,
            currentX: 520,
            currentY: 400,
          },
          {
            id: 'YELLOW_2',
            color: 'yellow',
            position: -1,
            currentX: 400,
            currentY: 520,
          },
          {
            id: 'YELLOW_3',
            color: 'yellow',
            position: -1,
            currentX: 520,
            currentY: 520,
          },
        );
      } else if (player.includes('GREEN')) {
        newPieces.push(
          {
            id: 'GREEN_0',
            color: 'green',
            position: -1,
            currentX: 400,
            currentY: 40,
          },
          {
            id: 'GREEN_1',
            color: 'green',
            position: -1,
            currentX: 400,
            currentY: 160,
          },
          {
            id: 'GREEN_2',
            color: 'green',
            position: -1,
            currentX: 520,
            currentY: 40,
          },
          {
            id: 'GREEN_3',
            color: 'green',
            position: -1,
            currentX: 520,
            currentY: 160,
          },
        );
      } else if (player.includes('BLUE')) {
        newPieces.push(
          {
            id: 'BLUE_0',
            color: 'blue',
            position: -1,
            currentX: 40,
            currentY: 40,
          },
          {
            id: 'BLUE_1',
            color: 'blue',
            position: -1,
            currentX: 40,
            currentY: 160,
          },
          {
            id: 'BLUE_2',
            color: 'blue',
            position: -1,
            currentX: 160,
            currentY: 40,
          },
          {
            id: 'BLUE_3',
            color: 'blue',
            position: -1,
            currentX: 160,
            currentY: 160,
          },
        );
      }
    });

    this.piecesSubject.next(newPieces);
  }

  constructor() {
    // this.initPieces();
  }

  startGame(playerCount: number, playerColors?: string[], myColor?: string) {
    if (playerColors && playerColors.length > 0) {
      this.gameState.activePlayers = playerColors;
      this.myColor = myColor || playerColors[0];
    } else {
      const turnOrder = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

      this.gameState.activePlayers = turnOrder.slice(0, playerCount);
      this.myColor = this.gameState.activePlayers[0];
    }

    this.gameState.pieces = {};
    this.gameState.activePlayers.forEach((color) => {
      for (let i = 0; i < 4; i++) {
        this.gameState.pieces[`${color}_${i}`] = -1;
      }
    });

    this.initPieces();

    this.gameState.currentTurn = 0;
    this.gameState.diceValue = 0;
    this.gameState.gameWon = null;
    this.gameState.movablePieces = [];
  }

  rollDice(): number {
    const currentPlayer =
      this.gameState.activePlayers[this.gameState.currentTurn];
    if (currentPlayer !== this.myColor) {
      return this.gameState.diceValue;
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    this.gameState.diceValue = diceRoll;
    this.gameState.movablePieces = this.calculateMovablePieces(
      currentPlayer,
      this.gameState.diceValue,
    );

    this.gameStateSubject.next({ ...this.gameState });
    return this.gameState.diceValue;
  }

  private calculateMovablePieces(color: string, dice: number): string[] {
    const movable: string[] = [];
    ['_0', '_1', '_2', '_3'].forEach((suffix) => {
      const pieceId = `${color}${suffix}`;
      const pos = this.gameState.pieces[pieceId];
      if (pos === -999) return; // Hidden

      if (pos === -1 && dice === 6) {
        movable.push(pieceId);
      } else if (pos >= 0 && pos + dice <= 56) movable.push(pieceId);
    });
    return movable;
  }

  async movePiece(pieceId: string): Promise<boolean> {
    const color = pieceId.split('_')[0];
    const currentPlayer =
      this.gameState.activePlayers[this.gameState.currentTurn];

    if (
      currentPlayer !== color ||
      !this.gameState.movablePieces.includes(pieceId)
    ) {
      return false; // Invalid
    }

    this.isAnimating = true;

    const oldPos = this.gameState.pieces[pieceId];
    const gotSix = this.gameState.diceValue === 6;

    if (oldPos === -1) {
      this.gameState.pieces[pieceId] = 0;
      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });
      await this.delay(400);

      // Keep turn because rolled 6 to come out
      // Don't change turn, player gets another roll

      // Reset for next roll
      this.gameState.movablePieces = [];
      this.gameState.diceValue = 0;

      this.gameStateSubject.next({ ...this.gameState });
      this.isAnimating = false;

      return true;
    }

    const startPos = oldPos;
    const steps = this.gameState.diceValue;

    for (let step = 1; step <= steps; step++) {
      const currentPos = startPos + step;
      this.gameState.pieces[pieceId] = currentPos;
      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });

      await this.delay(400);
    }

    const finalPos = startPos + steps;

    const killedSomeone = await this.checkCollisionsByCoordinates(
      pieceId,
      color,
    );

    if (!gotSix && !killedSomeone) {
      this.gameState.currentTurn =
        (this.gameState.currentTurn + 1) % this.gameState.activePlayers.length;
    }

    // Reset
    this.gameState.movablePieces = [];
    this.gameState.diceValue = 0;

    this.checkWin();
    this.gameStateSubject.next({ ...this.gameState });

    this.isAnimating = false;

    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  updateGameState(newState: IGameState): void {
    this.gameState = { ...newState };
    this.gameStateSubject.next({ ...this.gameState });
  }

  private async checkCollisionsByCoordinates(
    movingPieceId: string,
    movingColor: string,
  ): Promise<boolean> {
    const movingPiece = this.pieces.find((p) => p.id === movingPieceId);
    if (!movingPiece) return false;

    const movingPos = this.gameState.pieces[movingPieceId];

    if (movingPos === -1 || movingPos >= 52) {
      return false;
    }

    //actual coordinates
    const movingPath = this.getPathMap(movingColor.toLowerCase());
    const movingCell = movingPath[movingPos];

    if (!movingCell) {
      return false;
    }

    // const safeCells = [
    //   { row: 14, col:7 },
    //   { row: 2, col: 9 },
    //   { row: 7, col: 2 },
    //   { row: 9, col: 14 },
    //   { row: 9, col: 6 },
    //   { row: 7, col:10 },
    //   { row: 6, col: 7 },
    //   { row: 10, col: 9 }
    // ];

    const safeCells = [
      { row: 14, col: 7 },
      { row: 9, col: 3 },
      { row: 7, col: 2 },
      { row: 3, col: 7 },
      { row: 2, col: 9 },
      { row: 7, col: 13 },
      { row: 9, col: 14 },
      { row: 13, col: 9 },
    ];

    const isSafe = safeCells.some(
      (safe) => safe.row === movingCell.row && safe.col === movingCell.col,
    );
    if (isSafe) {
      return false;
    }

    let killedSomeone = false;

    for (const pieceId of Object.keys(this.gameState.pieces)) {
      if (pieceId === movingPieceId) continue;

      const opponentPos = this.gameState.pieces[pieceId];
      if (opponentPos === -1 || opponentPos >= 52) {
        continue;
      }
      const opponentColor = pieceId.split('_')[0];
      if (!this.gameState.activePlayers.includes(opponentColor)) {
        continue;
      }

      // Get opponent's actual grid coordinates
      const opponentPath = this.getPathMap(opponentColor.toLowerCase());
      const opponentCell = opponentPath[opponentPos];

      if (!opponentCell) continue;

      // Comparing actual grid
      if (
        opponentCell.row === movingCell.row &&
        opponentCell.col === movingCell.col
      ) {
        if (opponentColor !== movingColor) {
          await this.sendPieceHome(pieceId);
          killedSomeone = true;
        } else {
          //same Color
        }
      }
    }

    return killedSomeone;
  }

  private async sendPieceHome(pieceId: string): Promise<void> {
    const piece = this.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    const currentPos = this.gameState.pieces[pieceId];
    if (currentPos < 0) {
      this.gameState.pieces[pieceId] = -1;
      this.syncUiPieces();
      return;
    }

    for (let pos = currentPos - 1; pos >= 0; pos--) {
      this.gameState.pieces[pieceId] = pos;
      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });
      await this.delay(20);
    }

    this.gameState.pieces[pieceId] = -1;
    this.syncUiPieces();
    this.gameStateSubject.next({ ...this.gameState });
  }

  async applyRemoteGameState(remoteState: any): Promise<void> {
    if (!remoteState) return;

    if (remoteState.lastMove && remoteState.lastMove.pieceId) {
      // Only animate, don't update other state yet
      await this.animateRemoteMove(remoteState.lastMove);

      const { pieceId, toPos } = remoteState.lastMove;
      this.gameState.pieces[pieceId] = toPos;

      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });
    } else {
      // Full state update (no animation)
      this.gameState.currentTurn = remoteState.currentTurn;
      this.gameState.diceValue = remoteState.diceValue;
      this.gameState.pieces = { ...remoteState.pieces };
      this.gameState.movablePieces = remoteState.movablePieces || [];

      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });
    }
  }

  private async animateRemoteMove(moveInfo: {
    pieceId: string;
    fromPos: number;
    toPos: number;
  }): Promise<void> {
    const { pieceId, fromPos, toPos } = moveInfo;

    // Handle coming out of home
    if (fromPos === -1 && toPos === 0) {
      this.gameState.pieces[pieceId] = 0;
      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });
      await this.delay(400);
      return;
    }

    // Handle being sent back home
    if (toPos === -1 && fromPos >= 0) {
      // Animate backwards to home
      for (let pos = fromPos - 1; pos >= 0; pos--) {
        this.gameState.pieces[pieceId] = pos;
        this.syncUiPieces();
        this.gameStateSubject.next({ ...this.gameState });
        await this.delay(50);
      }
      this.gameState.pieces[pieceId] = -1;
      this.syncUiPieces();
      this.gameStateSubject.next({ ...this.gameState });
      return;
    }

    // Animate normal movement step by step
    if (fromPos >= 0 && toPos > fromPos) {
      for (let step = fromPos + 1; step <= toPos; step++) {
        this.gameState.pieces[pieceId] = step;
        this.syncUiPieces();
        this.gameStateSubject.next({ ...this.gameState });
        await this.delay(400);
      }
    }
  }

  getMyColor(): string {
    return this.myColor;
  }

  private checkWin() {
    this.gameState.activePlayers.forEach((color) => {
      const allWon = ['_0', '_1', '_2', '_3'].every(
        (suffix) => this.gameState.pieces[`${color}${suffix}`] >= 58,
      );
      if (allWon) this.gameState.gameWon = color;
    });
  }

  getPathMap(color: string): { row: number; col: number }[] {
    switch (color) {
      case 'red':
        return this.PathArrayRED;
      case 'green':
        return this.PathArrayGREEN;
      case 'blue':
        return this.PathArrayBLUE;
      case 'yellow':
        return this.PathArrayYELLOW;
      default:
        return [];
    }
  }

  updatePiecePosition(pieceId: string, position: number) {
    const piece = this.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    const path = this.getPathMap(piece.color);
    if (path[position]) {
      const { row, col } = path[position];

      piece.currentX = (col - 1) * 40;
      piece.currentY = (row - 1) * 40;
      piece.position = position;
    }
  }

  getVisiblePieces(): IPiece[] {
    return this.pieces.filter((p) => this.gameState.pieces[p.id] !== -999);
  }

  getCurrentPlayer(): string {
    return this.gameState.activePlayers[this.gameState.currentTurn] || '';
  }

  private syncUiPieces() {
    this.pieces = this.piecesSubject.value;
    const updated = this.pieces.map((p) => {
      const newPiece = { ...p };
      const pos = this.gameState.pieces[p.id];
      newPiece.position = pos;

      if (pos === -1) {
        this.resetToHome(newPiece);
      } else if (pos >= 0) {
        // Update based on path
        const path = this.getPathMap(newPiece.color);
        if (path[pos]) {
          const { row, col } = path[pos];
          newPiece.currentX = (col - 1) * 40;
          newPiece.currentY = (row - 1) * 40;
        }
      }
      return newPiece;
    });

    this.pieces = updated;
    this.piecesSubject.next(updated);
  }

  private resetToHome(piece: IPiece) {
    const homePositions: { [key: string]: { x: number; y: number }[] } = {
      RED: [
        { x: 40, y: 400 },
        { x: 40, y: 520 },
        { x: 160, y: 400 },
        { x: 160, y: 520 },
      ],
      YELLOW: [
        { x: 400, y: 400 },
        { x: 520, y: 400 },
        { x: 400, y: 520 },
        { x: 520, y: 520 },
      ],
      GREEN: [
        { x: 400, y: 40 },
        { x: 400, y: 160 },
        { x: 520, y: 40 },
        { x: 520, y: 160 },
      ],
      BLUE: [
        { x: 40, y: 40 },
        { x: 40, y: 160 },
        { x: 160, y: 40 },
        { x: 160, y: 160 },
      ],
    };

    const color = piece.id.split('_')[0];
    const index = parseInt(piece.id.split('_')[1]);
    const pos = homePositions[color]?.[index];

    if (pos) {
      piece.currentX = pos.x;
      piece.currentY = pos.y;
    }
  }

  PathArrayRED = [
    { row: 14, col: 7 },
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 6 },
    { row: 9, col: 5 },
    { row: 9, col: 4 },
    { row: 9, col: 3 },
    { row: 9, col: 2 },
    { row: 9, col: 1 },
    { row: 8, col: 1 },
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 },
    { row: 6, col: 7 },
    { row: 5, col: 7 },
    { row: 4, col: 7 },
    { row: 3, col: 7 },
    { row: 2, col: 7 },
    { row: 1, col: 7 },
    { row: 1, col: 8 },
    { row: 1, col: 9 },
    { row: 2, col: 9 },
    { row: 3, col: 9 },
    { row: 4, col: 9 },
    { row: 5, col: 9 },
    { row: 6, col: 9 },
    { row: 7, col: 10 },
    { row: 7, col: 11 },
    { row: 7, col: 12 },
    { row: 7, col: 13 },
    { row: 7, col: 14 },
    { row: 7, col: 15 },
    { row: 8, col: 15 },
    { row: 9, col: 15 },

    { row: 9, col: 14 },
    { row: 9, col: 13 },
    { row: 9, col: 12 },
    { row: 9, col: 11 },
    { row: 9, col: 10 },
    { row: 10, col: 9 },
    { row: 11, col: 9 },
    { row: 12, col: 9 },
    { row: 13, col: 9 },
    { row: 14, col: 9 },
    { row: 15, col: 9 },
    { row: 15, col: 8 },
    { row: 14, col: 8 },
    { row: 13, col: 8 },
    { row: 12, col: 8 },
    { row: 11, col: 8 },
    { row: 10, col: 8 },
    { row: 9, col: 8 },
  ];

  PathArrayGREEN = [
    { row: 2, col: 9 },
    { row: 3, col: 9 },
    { row: 4, col: 9 },
    { row: 5, col: 9 },
    { row: 6, col: 9 },
    { row: 7, col: 10 },
    { row: 7, col: 11 },
    { row: 7, col: 12 },
    { row: 7, col: 13 },
    { row: 7, col: 14 },
    { row: 7, col: 15 },
    { row: 8, col: 15 },
    { row: 9, col: 15 },

    { row: 9, col: 14 },
    { row: 9, col: 13 },
    { row: 9, col: 12 },
    { row: 9, col: 11 },
    { row: 9, col: 10 },
    { row: 10, col: 9 },
    { row: 11, col: 9 },
    { row: 12, col: 9 },
    { row: 13, col: 9 },
    { row: 14, col: 9 },
    { row: 15, col: 9 },
    { row: 15, col: 8 },
    { row: 14, col: 7 },
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 6 },
    { row: 9, col: 5 },
    { row: 9, col: 4 },
    { row: 9, col: 3 },
    { row: 9, col: 2 },
    { row: 9, col: 1 },
    { row: 8, col: 1 },
    { row: 8, col: 1 },
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 },
    { row: 6, col: 7 },
    { row: 5, col: 7 },
    { row: 4, col: 7 },
    { row: 3, col: 7 },
    { row: 2, col: 7 },
    { row: 1, col: 7 },
    { row: 1, col: 8 },
    { row: 2, col: 8 },
    { row: 3, col: 8 },
    { row: 4, col: 8 },
    { row: 5, col: 8 },
    { row: 6, col: 8 },
    { row: 7, col: 8 },
  ];

  PathArrayBLUE = [
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 },
    { row: 6, col: 7 },
    { row: 5, col: 7 },
    { row: 4, col: 7 },
    { row: 3, col: 7 },
    { row: 2, col: 7 },
    { row: 1, col: 7 },
    { row: 1, col: 8 },
    { row: 1, col: 9 },
    { row: 2, col: 9 },
    { row: 3, col: 9 },
    { row: 4, col: 9 },
    { row: 5, col: 9 },
    { row: 6, col: 9 },
    { row: 7, col: 10 },
    { row: 7, col: 11 },
    { row: 7, col: 12 },
    { row: 7, col: 13 },
    { row: 7, col: 14 },
    { row: 7, col: 15 },
    { row: 8, col: 15 },
    { row: 9, col: 15 },

    { row: 9, col: 14 },
    { row: 9, col: 13 },
    { row: 9, col: 12 },
    { row: 9, col: 11 },
    { row: 9, col: 10 },
    { row: 10, col: 9 },
    { row: 11, col: 9 },
    { row: 12, col: 9 },
    { row: 13, col: 9 },
    { row: 14, col: 9 },
    { row: 15, col: 9 },
    { row: 15, col: 8 },
    { row: 14, col: 7 },
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 6 },
    { row: 9, col: 5 },
    { row: 9, col: 4 },
    { row: 9, col: 3 },
    { row: 9, col: 2 },
    { row: 9, col: 1 },
    { row: 8, col: 1 },
    { row: 8, col: 2 },
    { row: 8, col: 3 },
    { row: 8, col: 4 },
    { row: 8, col: 5 },
    { row: 8, col: 6 },
    { row: 8, col: 7 },
  ];
  PathArrayYELLOW = [
    { row: 9, col: 14 },
    { row: 9, col: 13 },
    { row: 9, col: 12 },
    { row: 9, col: 11 },
    { row: 9, col: 10 },
    { row: 10, col: 9 },
    { row: 11, col: 9 },
    { row: 12, col: 9 },
    { row: 13, col: 9 },
    { row: 14, col: 9 },
    { row: 15, col: 9 },
    { row: 15, col: 8 },
    { row: 15, col: 7 },
    { row: 14, col: 7 },
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 6 },
    { row: 9, col: 5 },
    { row: 9, col: 4 },
    { row: 9, col: 3 },
    { row: 9, col: 2 },
    { row: 9, col: 1 },
    { row: 8, col: 1 },
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 },
    { row: 6, col: 7 },
    { row: 5, col: 7 },
    { row: 4, col: 7 },
    { row: 3, col: 7 },
    { row: 2, col: 7 },
    { row: 1, col: 7 },
    { row: 1, col: 8 },
    { row: 1, col: 9 },
    { row: 2, col: 9 },
    { row: 3, col: 9 },
    { row: 4, col: 9 },
    { row: 5, col: 9 },
    { row: 6, col: 9 },
    { row: 7, col: 10 },
    { row: 7, col: 11 },
    { row: 7, col: 12 },
    { row: 7, col: 13 },
    { row: 7, col: 14 },
    { row: 7, col: 15 },
    { row: 8, col: 15 },
    { row: 8, col: 14 },
    { row: 8, col: 13 },
    { row: 8, col: 12 },
    { row: 8, col: 11 },
    { row: 8, col: 10 },
    { row: 8, col: 9 },
  ];
}
