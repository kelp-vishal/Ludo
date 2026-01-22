import { IsString, IsNotEmpty, MinLength } from 'class-validator';

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
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
