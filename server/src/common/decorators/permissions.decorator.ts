import { SetMetadata } from '@nestjs/common';

export enum Permission {
  gameCreate = 'game:create',
  gameView = 'game:view',
  gameUpdate = 'game:update',
  gameDelete = 'game:delete',
  roomCreate = 'room:create',
  roomManage = 'room:manage',
}

export const PERMISSIONS_KEY = 'permissions';
export const UserPermissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
