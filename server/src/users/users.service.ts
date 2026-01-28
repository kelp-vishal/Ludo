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
    this.logger.log(`Creating the User with username ${username}`);
    try {
      const user = await this.userModel.create({
        username,
        email,
        password: hashedPassword,
      });
      this.logger.log(` User created with username ${username}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error while Creating the User with username ${username}`,
      );
      throw error;
    }
  }

  async findUserByUserName(username: string): Promise<User | null> {
    this.logger.log(`Finding the User with username ${username}`);
    try {
      const user = await this.userModel.findOne({ where: { username } });
      this.logger.log(`User found with username ${username}`);
      return user;
    } catch (error) {
      this.logger.error(`Error while finding the user - username ${username}`);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding the User with Email ${email}`);
    try {
      const user = await this.userModel.findOne({ where: { email } });
      this.logger.log(`User found with Email ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error while finding the user - email ${email}}`);
      throw error;
    }
  }
}
