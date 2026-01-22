import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject } from 'rxjs';
import { IRoomPlayer } from '../../interfaces/room.interfaces';

export interface GameRoom {
  roomId: string;
  players: IRoomPlayer[];
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
  hostSocketId: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private currentRoomSubject = new BehaviorSubject<GameRoom | null>(null);
  private availableRoomsSubject = new BehaviorSubject<GameRoom[]>([]);
  private playersSubject = new BehaviorSubject<IRoomPlayer[]>([]);
  private gameStartedSubject = new BehaviorSubject<boolean>(false);

  currentRoom$ = this.currentRoomSubject.asObservable();
  availableRooms$ = this.availableRoomsSubject.asObservable();
  players$ = this.playersSubject.asObservable();
  gameStarted$ = this.gameStartedSubject.asObservable();

  constructor(private socketService: SocketService) {
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socketService.currentRoom$.subscribe((room) => {
      this.currentRoomSubject.next(room as GameRoom | null);
    });

    this.socketService.playersInRoom$.subscribe((players) => {
      this.playersSubject.next(players as IRoomPlayer[]);
    });

    this.socketService.rooms$.subscribe((rooms) => {
      this.availableRoomsSubject.next(rooms as GameRoom[]);
    });
  }

  createRoom(playerCount: number, playerName: string = 'Player'): void {
    console.log('Vishal');
    this.socketService.createRoom(playerCount, playerName);
  }

  joinRoom(roomId: string, playerName: string = 'Player'): void {
    this.socketService.joinRoom(roomId, playerName);
  }

  leaveRoom(): void {
    this.socketService.leaveRoom();
    this.currentRoomSubject.next(null);
    this.playersSubject.next([]);
  }

  startGame(): void {
    this.socketService.startGame();
    this.gameStartedSubject.next(true);
  }

  getRoomsList(): void {
    this.socketService.getRoomsList();
  }

  getCurrentRoom(): GameRoom | null {
    return this.currentRoomSubject.value;
  }

  getAvailableRooms(): GameRoom[] {
    return this.availableRoomsSubject.value;
  }

  getPlayers(): IRoomPlayer[] {
    return this.playersSubject.value;
  }

  isGameStarted(): boolean {
    return this.gameStartedSubject.value;
  }

  resetGameState(): void {
    this.gameStartedSubject.next(false);
  }
}
