import { Injectable } from '@nestjs/common';

export interface IPosition {
  row: number;
  col: number;
}

export interface IPieceState {
  [pieceId: string]: number;
}

@Injectable()
export class GameLogicService {
  private readonly safeCells: IPosition[] = [
    { row: 14, col: 7 },
    { row: 9, col: 3 },
    { row: 7, col: 2 },
    { row: 3, col: 7 },
    { row: 2, col: 9 },
    { row: 7, col: 13 },
    { row: 9, col: 14 },
    { row: 13, col: 9 },
  ];

  rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  calculateMovablePieces(
    color: string,
    dice: number,
    pieces: IPieceState,
  ): string[] {
    const movable: string[] = [];
    ['_0', '_1', '_2', '_3'].forEach((suffix) => {
      const pieceId = `${color}${suffix}`;
      const pos = pieces[pieceId];

      if (pos === undefined || pos === -999) {
        return; // Skip hidden or non-existent pieces
      }

      if (pos === -1 && dice === 6) {
        movable.push(pieceId);
      } else if (pos >= 0 && pos + dice <= 56) {
        movable.push(pieceId);
      }
    });
    return movable;
  }

  validateMove(
    pieceId: string,
    currentPlayer: string,
    movablePieces: string[],
  ): boolean {
    const color = pieceId.split('_')[0];
    return color === currentPlayer && movablePieces.includes(pieceId);
  }

  movePiece(
    pieceId: string,
    diceValue: number,
    pieces: IPieceState,
  ): { newPosition: number; steps: number[] } {
    const oldPos = pieces[pieceId];
    const steps: number[] = [];

    if (oldPos === -1) {
      // Coming out of home
      return { newPosition: 0, steps: [0] };
    }

    // Calculate intermediate steps for animation
    const startPos = oldPos;
    for (let step = 1; step <= diceValue; step++) {
      steps.push(startPos + step);
    }

    return { newPosition: startPos + diceValue, steps };
  }

  checkCollision(
    movingPieceId: string,
    movingColor: string,
    pieces: IPieceState,
    activePlayers: string[],
  ): { killedPieceId: string | null; killedSomeone: boolean } {
    const movingPos = pieces[movingPieceId];

    if (movingPos === -1 || movingPos >= 52) {
      return { killedPieceId: null, killedSomeone: false };
    }

    const movingPath = this.getPathMap(movingColor.toLowerCase());
    const movingCell = movingPath[movingPos];

    if (!movingCell) {
      return { killedPieceId: null, killedSomeone: false };
    }

    // Check if on safe cell
    const isSafe = this.safeCells.some(
      (safe) => safe.row === movingCell.row && safe.col === movingCell.col,
    );

    if (isSafe) {
      return { killedPieceId: null, killedSomeone: false };
    }

    // Check for collisions with other pieces
    for (const pieceId of Object.keys(pieces)) {
      if (pieceId === movingPieceId) continue;

      const opponentPos = pieces[pieceId];
      if (opponentPos === -1 || opponentPos >= 52) continue;

      const opponentColor = pieceId.split('_')[0];
      if (!activePlayers.includes(opponentColor)) continue;

      const opponentPath = this.getPathMap(opponentColor.toLowerCase());
      const opponentCell = opponentPath[opponentPos];

      if (!opponentCell) continue;

      // Check if on same cell
      if (
        opponentCell.row === movingCell.row &&
        opponentCell.col === movingCell.col
      ) {
        if (opponentColor !== movingColor) {
          return { killedPieceId: pieceId, killedSomeone: true };
        }
      }
    }

    return { killedPieceId: null, killedSomeone: false };
  }

  checkWin(color: string, pieces: IPieceState): boolean {
    return ['_0', '_1', '_2', '_3'].every(
      (suffix) => pieces[`${color}${suffix}`] >= 58,
    );
  }

  getPathMap(color: string): IPosition[] {
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

  private readonly PathArrayRED: IPosition[] = [
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

  private readonly PathArrayGREEN: IPosition[] = [
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

  private readonly PathArrayBLUE: IPosition[] = [
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

  private readonly PathArrayYELLOW: IPosition[] = [
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
