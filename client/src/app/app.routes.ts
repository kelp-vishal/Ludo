import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './identity/login/login.component';
import { SignupComponent } from './identity/signup/signup.component';
import { LudoBoardComponent } from './game/ludo-board/ludo-board.component';
import { RoomConnectGenerateComponent } from './game/room-connect-generate/room-connect-generate.component';
import { GameSetupComponent } from './game/game-setup/game-setup.component';
import { authguard } from './identity/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'ludo-board',
    component: LudoBoardComponent,
    canActivate: [authguard],
  },
  {
    path: 'room-connect',
    component: RoomConnectGenerateComponent,
    canActivate: [authguard],
  },
  {
    path: 'game-setup',
    component: GameSetupComponent,
    canActivate: [authguard],
  },
];
