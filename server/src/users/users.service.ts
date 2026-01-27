import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../model/user.model';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async createUser(
    username: string,
    hashedPassword: string,
    email: string,
  ): Promise<User> {
    this.logger.log(`Creating User ${username}`);
    try {
      const user = await this.userModel.create({
        username,
        email,
        password: hashedPassword,
      });

      this.logger.log(`User Created successfully! ${username}.`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${username}`);
      throw error;
    }
  }

  async findUserByUserName(username: string): Promise<User | null> {
    this.logger.log(`Finding user by username ${username}`);
    try {
      const user = await this.userModel.findOne({ where: { username } });

      if (!user) {
        this.logger.log(`User not Found by Username ${username}`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}`);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user by email ${email}`);
    try {
      const user = await this.userModel.findOne({ where: { email } });
      if (!user) {
        this.logger.log(`User not Found by Email ${email}`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}`);
      throw error;
    }
  }
}
