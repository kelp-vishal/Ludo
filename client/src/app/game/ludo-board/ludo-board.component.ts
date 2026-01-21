
import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPiece } from '../../interfaces/ludoboard.interfaces';
import { IGameState } from '../../interfaces/ludoboard.interfaces';
import { GameService } from '../services/game.service';
import { SocketService } from '../services/socket.service';
import { RoomService } from '../services/room.service';
import { Subscription } from 'rxjs';

let gameState = {
  currentTurn: 'RED',
  diceValue: 0,
  movablePieces: [],
  pieces: {
    RED_0: { position: -1 },
    RED_1: { position: -1 },
    RED_2: { position: -1 },
    RED_3: { position: -1 },
    YELLOW_0: { position: -1 },
    YELLOW_1: { position: -1 },
    YELLOW_2: { position: -1 },
    YELLOW_3: { position: -1 },
    GREEN_0: { position: -1 },
    GREEN_1: { position: -1 },
    GREEN_2: { position: -1 },
    GREEN_3: { position: -1 },
    BLUE_0: { position: -1 },
    BLUE_1: { position: -1 },
    BLUE_2: { position: -1 },
    BLUE_3: { position: -1 }
  }
};

@Component({
  selector: 'app-ludo-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ludo-board.component.html',
  styleUrls: ['./ludo-board.component.css']
})
export class LudoBoardComponent implements OnInit, OnDestroy {

  Math = Math;
  // turnOrder = ['RED', 'YELLOW', 'GREEN', 'BLUE'];
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

  ngOnInit() {
    // Subscribe to gameState changes
    const gameStateSubscription = this.gameService.gameState$.subscribe(state => {
      this.gameState = state;
      this.triggerAnimations();
      // Broadcast game state to other players
      // this.syncGameStateWithOthers();
    });

    // Subscribe to socket game state updates from other players
    const socketStateSubscription = this.socketService.gameState$.subscribe(remoteState => {
      if (remoteState && remoteState.updatedBy !== this.socketService.getSocketId()) {
        console.log('Received game state update from another player:', remoteState);
        
        this.gameService.applyRemoteGameState(remoteState.gameState);
      }
    });

    this.subscriptions.push(gameStateSubscription, socketStateSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  syncGameStateWithOthers(lastMovedPieceId?: string,fromPos?:number ,toPos?:number): void {
    if (this.gameState) {
      const updateData : any={
        currentTurn: this.gameState.currentTurn,
        diceValue: this.gameState.diceValue,
        pieces: this.gameState.pieces,
        movablePieces: this.gameState.movablePieces,
        timestamp: new Date()
      };

      if(lastMovedPieceId !== undefined && fromPos !== undefined && toPos !== undefined){
        updateData.lastMove={
          pieceId:lastMovedPieceId,
          fromPos:fromPos,
          toPos:toPos
        };
      }

      this.socketService.sendGameStateUpdate(updateData);
    }
  }

  triggerAnimations() {
    if (!this.gameState) return;
    this.gameState.movablePieces.forEach(pieceId => {
      const piece = this.gameService.pieces.find(p => p.id === pieceId);
      if (piece) {
        console.log(`Animate piece ${piece.id} at position ${piece.position}`);
      }
    });
  }

  getCurrentPlayerName():string{
    const currentColor = this.gameService.getCurrentPlayer();
    const currentRoom = this.roomService.getCurrentRoom();

    if(!currentRoom || !currentColor){
      return currentColor || 'Player';
    }

    const player = currentRoom.players.find(p=> p.color=== currentColor);
    return player?.playerName || currentColor;
  }


  rollDice() {
    console.log(this.gameState);
    if (!this.gameState?.gameWon && this.isMyTurn()) {
      this.isRolling = true;
      const rolledValue = this.gameService.rollDice();
      this.syncGameStateWithOthers();
      
      setTimeout(() => {
        this.isRolling = false;
        
        // Check if  no movable pieces
        if (this.gameState?.movablePieces?.length === 0) {
    
          // setTimeout(() => {
            console.log("GameStateUpdate in ludo-board.ts")
            if (this.gameState) {
              this.gameState.diceValue = 0;
              this.gameState.currentTurn = (this.gameState.currentTurn+1) % this.gameState.activePlayers.length;
              this.gameService.updateGameState(this.gameState);
              this.syncGameStateWithOthers();
            }
          // }, 1000);
        } else {
          // Normal cas
          
          // Auto-move if -one piece only
          if (this.gameState?.movablePieces?.length ===1) {
            const pieceId = this.gameState.movablePieces[0];

            setTimeout(() => {
              this.selectPiece(pieceId);
            }, 300);
          }
        }
      }, 800);
    }
  }


  async selectPiece(pieceId: string) {
    const myColor = this.gameService.getMyColor();
    const pieceColor = pieceId.split('_')[0];

    if(pieceColor !== myColor){
      return;
    }

    const oldPos =this.gameState?.pieces[pieceId] ??-1;
    
    // Calculate new position before animating
    const diceValue = this.gameState?.diceValue?? 0;
    let newPos = oldPos;
    if (oldPos ===-1 && diceValue === 6) {
      newPos = 0;
    } else if (oldPos>= 0) {
      newPos = oldPos + diceValue;
    }
    
    // Sync with othr players
    this.syncGameStateWithOthers(pieceId,oldPos,newPos);


    const moved = await this.gameService.movePiece(pieceId);
    if (moved === true) {
      console.log('Piece moved:', pieceId);

      //Sync
      this.syncGameStateWithOthers();
    }
  }

  getPieceScale(piece: any): number {
    // Count how many pieces are at the same position
    const pieces = this.gameService.pieces || [];
    const samePosition = pieces.filter(p => 
      p.currentX === piece.currentX && 
      p.currentY === piece.currentY &&
      p.position >= 0
    ).length;
    
    // Scale down if multiple pieces at same position
    return samePosition > 1 ? 0.7 : 1;
  }

  getPieceOffset(piece: any): { x: number; y: number } {
    const pieces = this.gameService.pieces || [];
    const samePosArray = pieces.filter(p => 
      p.currentX === piece.currentX && 
      p.currentY === piece.currentY &&
      p.position >= 0
    );
    
    if (samePosArray.length <= 1) return { x: 0, y: 0 };
    
    const index = samePosArray.findIndex(p => p.id === piece.id);
    const offset = 8;
    
    // Offset pieces in a circular pattern
    return {
      x: index * offset,
      y: index * offset
    };
  }

  IsRedTurn(){
    return this.getCurrentPlayer().toLowerCase() === 'RED'.toLowerCase();
   
  }
  IsBlueTurn(){
    return this.getCurrentPlayer().toLowerCase() === 'BLUE'.toLowerCase();

    
  }
  IsYellowTurn(){
    return this.getCurrentPlayer().toLowerCase() === 'YELLOW'.toLowerCase();

   
  }
  IsGreenTurn(){
    return this.getCurrentPlayer().toLowerCase() === 'GREEN'.toLowerCase();

    // return this.gameService.isRedTurn();
  }

  getVisiblePieces() {
    return this.gameService.getVisiblePieces();
  }

  getCurrentPlayer() {
    return this.gameService.getCurrentPlayer();

  }

  isGameWon() {
    return this.gameService.gameState.gameWon;

  }

   isMyTurn(): boolean {
    const currentPlayer =this.gameService.getCurrentPlayer();
    const myColor = this.gameService.getMyColor();
    return currentPlayer === myColor;
  }

  isMyPiece(piece:any):boolean{
    const myColor = this.gameService.getMyColor();
    return piece.color === myColor.toLowerCase();
  }

  isRedHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 9 && row <= 15 && (col <= 5) && (col >= 0);
  }

  
  isYellowHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 9 && row <= 14 && col >= 9;
  }

  isGreenHome(index: number): boolean {
    const row = Math.floor(index/15);
    const col = index %15;
    return row >= 0 && row <= 5 && col >= 9;
  }

  isBlueHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 0 && row <= 5 && col <= 5;
  }

  isRedBorder(index: number):boolean{
    const row = Math.floor(index / 15);
    const col = index % 15;

    if((row == 9 && col <= 5 && col >= 0) || (row ==14 && col <= 5 && col >= 0) || (col ==0 && row >= 9 && row <= 15) ||(col == 5 && row >= 9 && row <= 15)) return true;
    else return false;
  }

  isYellowBorder(index: number):boolean{
    const row = Math.floor(index / 15);
    const col = index % 15;

    if((row == 9 && col >= 9) || (row ==14 && col >= 9) || (col ==9 && row >= 9) ||(col == 14 && row >= 9 )) return true;
    else return false;
  }

  isBlueBorder(index:number):boolean{
    const row = Math.floor(index / 15);
    const col = index % 15;
    if((row == 0 && col>=0 && col <=5) || (row ==5 && col>=0 && col <=5) || (col ==0 && row<=5 && row >= 0) ||(col ==5 && row<=5 && row >= 0) ) return true;
    else return false;
  }

  isGreenBorder(index:number):boolean{
    const row = Math.floor(index / 15);
    const col = index % 15;

    if((row == 0 && col>=9) || (row ==5 && col >= 9) || (col ==9 && row <= 5) ||(col == 14 && row <= 5 )) return true;
    else return false;
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

  isBaseAll(index:number):boolean{
    const row = Math.floor(index / 15);
    const col = index % 15;

    if((row === 10 && col == 1) || (row === 10 && col == 4) || (row === 13 && col == 1) || (row === 13 && col == 4)
      || (row === 1 && col == 1) || (row === 1 && col == 4) || (row === 4 && col == 1) || (row === 4 && col == 4)
       || (row === 1 && col == 10) || (row === 1 && col == 13) || (row === 4 && col == 10) || (row === 4 && col ==13)
       || (row === 10 && col == 10) || (row === 10 && col == 13) || (row === 13 && col == 10) || (row === 13&& col == 13)
    ) return true;
    else return false;
  }

  // PathArrayRED = [
  //   { row: 14, col: 7 },
  //   { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 6 }, { row: 9, col: 5 }, { row: 9, col: 4 }, { row: 9, col: 3 }, { row: 9, col: 2 }, { row: 9, col: 1 }, { row: 8, col: 1 }, { row: 7, col: 1 }, { row: 7, col: 2 },
  //   { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 }, { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 },
  //   { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 }, { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 10 },
  //   { row: 7, col: 11 }, { row: 7, col: 12 }, { row: 7, col: 13 }, { row: 7, col: 14 }, { row: 7, col: 15 }, { row: 8, col: 15 }, { row: 9, col: 15 },

  //   { row: 9, col: 14 }, { row: 9, col: 13 }, { row: 9, col: 12 }, { row: 9, col: 11 }, { row: 9, col: 10 }, { row: 10, col: 9 }, { row: 11, col: 9 }, { row: 12, col: 9 }, { row: 13, col: 9 }, { row: 14, col: 9 }, { row: 15, col: 9 }, { row: 15, col: 8 },
  //   { row: 14, col: 8 }, { row: 13, col: 8 }, { row: 12, col: 8 }, { row: 11, col: 8 }, { row: 10, col: 8 }, { row: 9, col: 8 }
  // ];

  // PathArrayGREEN = [
  //   { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 }, { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 10 },
  //   { row: 7, col: 11 }, { row: 7, col: 12 }, { row: 7, col: 13 }, { row: 7, col: 14 }, { row: 7, col: 15 }, { row: 8, col: 15 }, { row: 9, col: 15 },

  //   { row: 9, col: 14 }, { row: 9, col: 13 }, { row: 9, col: 12 }, { row: 9, col: 11 }, { row: 9, col: 10 }, { row: 10, col: 9 }, { row: 11, col: 9 }, { row: 12, col: 9 }, { row: 13, col: 9 }, { row: 14, col: 9 }, { row: 15, col: 9 }, { row: 15, col: 8 },
  //   { row: 14, col: 7 },
  //   { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 6 }, { row: 9, col: 5 }, { row: 9, col: 4 }, { row: 9, col: 3 }, { row: 9, col: 2 }, { row: 9, col: 1 }, { row: 8, col: 1 },
  //   { row: 8, col: 1 }, { row: 7, col: 1 }, { row: 7, col: 2 },
  //   { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 }, { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 },
  //   { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 8 }, { row: 7, col: 8 },
  // ];

  // PathArrayBLUE = [
  //   { row: 7, col: 2 },
  //   { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 }, { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 },
  //   { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 }, { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 10 },
  //   { row: 7, col: 11 }, { row: 7, col: 12 }, { row: 7, col: 13 }, { row: 7, col: 14 }, { row: 7, col: 15 }, { row: 8, col: 15 }, { row: 9, col: 15 },

  //   { row: 9, col: 14 }, { row: 9, col: 13 }, { row: 9, col: 12 }, { row: 9, col: 11 }, { row: 9, col: 10 }, { row: 10, col: 9 }, { row: 11, col: 9 }, { row: 12, col: 9 }, { row: 13, col: 9 }, { row: 14, col: 9 }, { row: 15, col: 9 }, { row: 15, col: 8 },
  //   { row: 14, col: 7 },
  //   { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 6 }, { row: 9, col: 5 }, { row: 9, col: 4 }, { row: 9, col: 3 }, { row: 9, col: 2 }, { row: 9, col: 1 }, { row: 8, col: 1 },
  //   { row: 8, col: 2 }, { row: 8, col: 3 }, { row: 8, col: 4 }, { row: 8, col: 5 }, { row: 8, col: 6 }, { row: 8, col: 7 }
  // ];
  // PathArrayYELLOW = [
  //   { row: 9, col: 14 }, { row: 9, col: 13 }, { row: 9, col: 12 }, { row: 9, col: 11 }, { row: 9, col: 10 }, { row: 10, col: 9 }, { row: 11, col: 9 }, { row: 12, col: 9 }, { row: 13, col: 9 }, { row: 14, col: 9 }, { row: 15, col: 9 }, { row: 15, col: 8 }, { row: 15, col: 7 },
  //   { row: 14, col: 7 },
  //   { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 6 }, { row: 9, col: 5 }, { row: 9, col: 4 }, { row: 9, col: 3 }, { row: 9, col: 2 }, { row: 9, col: 1 }, { row: 8, col: 1 }, { row: 7, col: 1 }, { row: 7, col: 2 },
  //   { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 }, { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 },
  //   { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 }, { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 10 },
  //   { row: 7, col: 11 }, { row: 7, col: 12 }, { row: 7, col: 13 }, { row: 7, col: 14 }, { row: 7, col: 15 }, { row: 8, col: 15 },
  //   { row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }
  // ];

}