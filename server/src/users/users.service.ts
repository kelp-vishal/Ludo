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
    return await this.userModel.create({
      username,
      email,
      password: hashedPassword,
    });
  }

  async findOne(username: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { email } });
  }
}
