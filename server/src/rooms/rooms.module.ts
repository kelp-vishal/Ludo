import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [GameModule],
  providers: [RoomsGateway],
})
export class RoomsModule {}
