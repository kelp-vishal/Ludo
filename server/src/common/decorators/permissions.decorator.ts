import { SetMetadata } from '@nestjs/common';

export enum Permission {
  GAME_CREATE = 'game:create',
  GAME_VIEW = 'game:view',
  GAME_UPDATE = 'game:update',
  GAME_DELETE = 'game:delete',
  ROOM_CREATE = 'room:create',
  ROOM_MANAGE = 'room:manage',
}

export const PERMISSIONS_KEY = 'permissions';
export const UserPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
