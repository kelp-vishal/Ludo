
import { IsNumber, IsString, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRoomDto {
  @IsNumber()
  @Min(2)
  @Max(4)
  maxPlayers: number;

  @IsString()
  @IsNotEmpty()
  playerName: string;
}
