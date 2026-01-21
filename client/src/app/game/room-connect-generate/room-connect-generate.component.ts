import { Component } from '@angular/core';
import { Router } from '@angular/router';
import{SocketService} from '../services/socket.service';

@Component({
  selector: 'app-room-connect-generate',
  imports: [],
  templateUrl: './room-connect-generate.component.html',
  styleUrl: './room-connect-generate.component.css'
})
export class RoomConnectGenerateComponent {
  constructor(
    private router: Router,
    private socketService :SocketService
  ) {
    socketService.connect();
  }

  playLocally(){
    this.router.navigateByUrl('game-setup');
  }
}
