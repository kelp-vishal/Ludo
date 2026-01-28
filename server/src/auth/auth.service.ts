import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ISignInResponse, IAuthResponse } from '../interfaces/auth.interfaces';
import { error } from 'console';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string): Promise<ISignInResponse> {
    try {
      const user = await this.userService.findUserByUserName(username);

      if (!user) {
        this.logger.error('Invalid credentials Entered');
        throw new UnauthorizedException('Invalid credentials');
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        this.logger.error('Invalid credentials Entered');
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log('SignIn Successfully');
      return {
        accessToken: this.jwtService.sign({
          sub: user.id,
          username: user.username,
        }),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.error('Something Went Wrong While SignIn..');
      throw error;
    }
  }

  async register(
    username: string,
    password: string,
    email: string,
  ): Promise<IAuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userService.findUserByUserName(username);
      if (existingUser) {
        this.logger.error('Username already exists');
        throw new ConflictException('Username already exists');
      }

      const existingEmail = await this.userService.findUserByEmail(email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await this.userService.createUser(
        username,
        hashedPassword,
        email,
      );

      this.logger.log('Registration Successfully Done..');

      return {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      };
    } catch {
      this.logger.error('Something Went Wrong while Registration..');
      throw error;
    }
  }
}
