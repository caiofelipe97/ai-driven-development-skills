import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, CurrentUserData } from '../types';

export function getCurrentUser(
  key: keyof CurrentUserData | undefined,
  context: ExecutionContext,
) {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const user = request.user;

  return key ? user?.[key] : user;
}

export const CurrentUser = createParamDecorator(getCurrentUser);
