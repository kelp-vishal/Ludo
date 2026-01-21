import { Injectable, UnauthorizedException, ConflictException,Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger= new Logger(AuthService.name);

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.jwtService.sign({ sub: user.id, username: user.username }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async register(username: string, password: string, email: string): Promise<any> {
    // Check if user already exists
    const existingUser = await this.userService.findOne(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userService.createUser(username, hashedPassword, email);

    return {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    };
  }
}

