import { TokenPayload } from '@app/auth';
import { CurrentUserData } from '../types';

export function toCurrentUser(payload: TokenPayload): CurrentUserData {
  return {
    id: payload.sub,
    email: payload.email,
  };
}
