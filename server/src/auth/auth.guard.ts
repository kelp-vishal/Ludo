import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {Reflector} from '@nestjs/core';
import {IS_PUBLIC_KEY} from './public.decorator';
@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private jwtService:JwtService,
    private reflector:Reflector
  ){}


  async canActivate(context: ExecutionContext,): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY,[
      context.getHandler(),
      context.getClass(),
    ]);
    if(isPublic){
      return true;
    }

    const Request=context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(Request);
    if(!token){
        throw new UnauthorizedException();
    }
    try{
      const payload=await this.jwtService.verifyAsync(token);

      Request['user']= payload;
    }
    catch{
        throw new UnauthorizedException();
    }
    return true;
  }
  extractTokenFromHeader(Request: any): string | undefined {
    const authHeader = Request.headers.authorization;
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
