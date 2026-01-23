import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../model/user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async createUser(
    username: string,
    hashedPassword: string,
    email: string,
  ): Promise<User> {
    try {
      return await this.userModel.create({
        username,
        email,
        password: hashedPassword,
      });
    } catch (error) {
      throw error;
    }
  }

  async findUserByUserName(username: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ where: { username } });
    } catch (error) {
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ where: { email } });
    } catch (error) {
      throw error;
    }
  }
}
