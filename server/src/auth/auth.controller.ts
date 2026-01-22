import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IRegisterResponse, ISignInResponse } from 'src/interfaces/auth.interfaces';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({ status: 200, description: 'Login Succcessful' })
  @ApiResponse({ status: 401, description: 'Invalid Credential' })
  signIn(@Body() loginDto: LoginDto): Promise<ISignInResponse> {
    return this.authService.signIn(loginDto.username, loginDto.password);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: 'User Registration' })
  @ApiResponse({ status: 200, description: 'Register Succcessful' })
  @ApiResponse({ status: 401, description: 'User already Exists' })
  async register(@Body() registerDto: RegisterDto): Promise<IRegisterResponse> {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
      registerDto.email,
    );
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User Profile' })
  @ApiResponse({ status: 200, description: 'Profile Retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req) {
    return req.user;
  }
}
