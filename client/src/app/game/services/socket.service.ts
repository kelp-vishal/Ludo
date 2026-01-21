
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRoom } from '../../interfaces/socket.interfaces';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {

  Room: IRoom[] = [];

  private socket: Socket | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private socketIdSubject = new BehaviorSubject<string>('');
  private roomsSubject = new BehaviorSubject<IRoom[]>([]);
  private currentRoomSubject = new BehaviorSubject<IRoom | null>(null);
  private playersInRoomSubject = new BehaviorSubject<Array<{ socketId: string; color?: string }>>([]);
  private gameStateSubject = new BehaviorSubject<any>(null);
  private gameStartedSubject = new BehaviorSubject<any>(null);

  connected$ = this.connectedSubject.asObservable();
  socketId$ = this.socketIdSubject.asObservable();
  rooms$ = this.roomsSubject.asObservable();
  currentRoom$ = this.currentRoomSubject.asObservable();
  playersInRoom$ = this.playersInRoomSubject.asObservable();
  gameState$ = this.gameStateSubject.asObservable();

  gameStarted$ = this.gameStartedSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });


    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connectedSubject.next(true);
      this.socketIdSubject.next(this.socket!.id || '');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Room events
    this.socket.on('room-created', (data: { room: IRoom }) => {
      console.log('Room created:', data.room);
      this.currentRoomSubject.next(data.room);
      this.playersInRoomSubject.next(data.room.players);
    });

    this.socket.on('room-joined', (data: { room: IRoom; message: string }) => {
      console.log('Joined room:', data.room);
      this.currentRoomSubject.next(data.room);
      this.playersInRoomSubject.next(data.room.players);
    });

    this.socket.on('player-joined', (data: { room: IRoom; message: string }) => {
      console.log('Player joined room:', data.message);
      this.currentRoomSubject.next(data.room);
      this.playersInRoomSubject.next(data.room.players);
    });

    this.socket.on('player-left', (data: { room: IRoom; message: string }) => {
      console.log('Player left room:', data.message);
      if (data.room) {
        this.currentRoomSubject.next(data.room);
        this.playersInRoomSubject.next(data.room.players);
      }
    });

    this.socket.on('rooms-list', (data: { rooms: IRoom[] }) => {
      console.log('Available rooms:', data.rooms);
      this.roomsSubject.next(data.rooms);
    });

    this.socket.on('game-started', (data: { room: IRoom; message: string; players: any }) => {
      console.log('Game started:', data.message);
      this.currentRoomSubject.next(data.room);

      this.gameStartedSubject.next(data);
    });

    this.socket.on('game-state-update', (data: any) => {
      console.log('Game state updated:', data);
      this.gameStateSubject.next(data);
    });

    this.socket.on('room-error', (data: { message: string }) => {
      console.error('Room error:', data.message);
    });
  }

  createRoom(playerCount: number, playerName: string = 'Player'): void {
    if (this.socket) {
      console.log("Socket service ts")
      this.socket.emit('create-room', {
        playerCount,
        playerName,
        socketId: this.socket.id
      });
    }
  }

  joinRoom(roomId: string, playerName: string = 'Player'): void {
    if (this.socket) {
      this.socket.emit('join-room', {
        roomId,
        playerName,
        socketId: this.socket.id
      });
    }
  }

  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('leave-room', {
        socketId: this.socket.id
      });
      this.currentRoomSubject.next(null);
      this.playersInRoomSubject.next([]);
    }
  }

  startGame(): void {
    if (this.socket) {
      this.socket.emit('start-game', {
        socketId: this.socket.id
      });
    }
  }

  getRoomsList(): void {
    if (this.socket) {
      this.socket.emit('get-rooms-list');
    }
  }

  sendGameStateUpdate(gameState: any): void {
    if (this.socket) {
      this.socket.emit('game-state-update', {
        socketId: this.socket.id,
        gameState
      });
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocketId(): string {
    return this.socket?.id || '';
  }

  isConnected(): boolean {
    return this.connectedSubject.value;
  }
}
