import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsGateway } from './rooms/rooms.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME ||'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE ,
      autoLoadEntities: true,
      synchronize: true,
    }),
    RoomsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, RoomsGateway],
})
export class AppModule {}

