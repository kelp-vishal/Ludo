import { IsString, IsNotEmpty, MinLength, IsObject } from 'class-validator';
import { UserdDto } from './user.dto';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class AuthResponseDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsNotEmpty()
  @IsObject()
  user: UserdDto;
}
