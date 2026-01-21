import { Module, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { jwtConstants } from './constants';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' };
    response.status(status).json({
      statusCode: status,
      ...(typeof message === 'object' ? message : { message }),
    });
  }
}

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: jwtConstants.secret||process.env.JWT_SECRET || 'default_jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard},
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
