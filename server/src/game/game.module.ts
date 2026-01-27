import { Module } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';
import { GameStateService } from './game-state.service';

@Module({
  providers: [GameLogicService, GameStateService],
  exports: [GameLogicService, GameStateService],
})
export class GameModule {}
