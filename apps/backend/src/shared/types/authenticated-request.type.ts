import { Request } from 'express';
import { CurrentUserData } from './current-user.type';

export interface AuthenticatedRequest extends Request {
  user?: CurrentUserData;
}
