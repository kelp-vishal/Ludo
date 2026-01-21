
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(username: string, hashedPassword: string, email: string): Promise<User> {
    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
    });
    return await this.usersRepository.save(user);
  }

  async findOne(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }
}
