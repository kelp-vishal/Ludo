import { Component, OnInit } from '@angular/core';
import { GameService } from '../services/game.service';
import { RoomService, GameRoom } from '../services/room.service';
import { SocketService } from '../services/socket.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { IAvailableRoom } from '../../interfaces/ludoboard.interfaces';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-setup.component.html',
  styleUrls: ['./game-setup.component.css'],
})
export class GameSetupComponent implements OnInit {
  AvailableRoom: IAvailableRoom[] = [];
  selectedPlayerCount: number = 2;
  playerName: string = '';
  view: 'menu' | 'create' | 'join' = 'menu';
  availableRooms: IAvailableRoom[] = [];
  selectedRoomId: string = '';
  isSocketConnected: boolean = false;
  socketId: string = '';
  currentRoom$!: Observable<GameRoom | null>;

  constructor(
    private gameService: GameService,
    private roomService: RoomService,
    private socketService: SocketService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.currentRoom$ = this.roomService.currentRoom$;
    // Checking socket connectin
    this.socketService.connected$.subscribe((connected) => {
      this.isSocketConnected = connected;
      if (connected) {
        console.log('Socket connected in game-setup');
      }
    });

    // Get socket ID
    this.socketService.socketId$.subscribe((id) => {
      this.socketId = id;
      console.log('Socket ID:', id);
    });

    // Listen for room updates
    this.roomService.currentRoom$.subscribe((room) => {
      if (room) {
        console.log('Joined room:', room);
      }
    });

    this.socketService.gameStarted$.subscribe((data) => {
      if (data && data.room) {
        const currentRoom = data.room;

        const TURN_ORDER = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
        const joinedColors = currentRoom.players.map(
          (p: { color: string }) => p.color,
        );
        const playerColors = TURN_ORDER.filter((c) => joinedColors.includes(c));
        const myColor =
          currentRoom.players.find(
            (p: { socketId: string }) => p.socketId === this.socketId,
          )?.color || 'RED';
        this.gameService.startGame(
          currentRoom.currentPlayers,
          playerColors,
          myColor,
        );

        this.router.navigate(['/ludo-board']);
      }
    });

    //available rooms
    this.roomService.getRoomsList();

    this.roomService.availableRooms$.subscribe((rooms) => {
      this.availableRooms = rooms;
      console.log('Available rooms:', rooms);
    });
  }

  showCreateRoom(): void {
    this.view = 'create';
  }

  showJoinRoom(): void {
    this.view = 'join';
    this.roomService.getRoomsList();
  }

  backToMenu(): void {
    this.view = 'menu';
  }

  createRoom(): void {
    if (!this.isSocketConnected) {
      alert('Socket not connected. Please refresh the page.');
      return;
    }

    if (this.playerName.trim() === '') {
      alert('Please enter your name');
      return;
    }
    // console.log('Vishal vishal');

    console.log(
      `Creating room for ${this.selectedPlayerCount} players...${this.playerName}`,
    );
    this.roomService.createRoom(this.selectedPlayerCount, this.playerName);
  }

  joinRoom(roomId: string): void {
    if (!this.isSocketConnected) {
      alert('Socket not connected. Please refresh the page.');
      return;
    }

    if (this.playerName.trim() === '') {
      alert('Please enter your name');
      return;
    }

    console.log(`Joining room ${roomId}...`);
    this.roomService.joinRoom(roomId, this.playerName);
  }

  startGameInRoom(): void {
    const currentRoom = this.roomService.getCurrentRoom();
    if (!currentRoom) {
      alert('You need to be in a room to start the game');
      return;
    }

    console.log('Host Starting game in room:', currentRoom.roomId);

    this.roomService.startGame();
    // this.router.navigate(['/ludo-board']);
  }

  startGame(playerCount: number): void {
    this.selectedPlayerCount = playerCount;
    this.showCreateRoom();
  }

  isHost(room:{hostSocketId:string}): boolean {
    return room?.hostSocketId === this.socketId;
  }
}
