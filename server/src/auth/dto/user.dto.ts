import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UserdDto {
  @IsString()
  id: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
