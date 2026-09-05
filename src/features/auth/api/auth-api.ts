import type {
  MessageResponse,
  PasswordRecoveryRequest,
  PasswordUpdateRequest,
  RefreshSessionRequest,
  Session,
  SessionResponse,
  SignInRequestWritable,
  SignUpRequestWritable,
  SignUpResponse,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function jsonRequest<T>(path: string, body: unknown, request: Request): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function signUp(
  input: SignUpRequestWritable,
  request: Request = apiRequest,
): Promise<SignUpResponse['data']> {
  return (await jsonRequest<SignUpResponse>('/auth/sign-up', input, request)).data;
}

export async function signIn(
  input: SignInRequestWritable,
  request: Request = apiRequest,
): Promise<Session> {
  return (await jsonRequest<SessionResponse>('/auth/sign-in', input, request)).data;
}

export async function refreshSession(
  refreshToken: string,
  request: Request = apiRequest,
): Promise<Session> {
  const body: RefreshSessionRequest = { refreshToken };
  return (await jsonRequest<SessionResponse>('/auth/refresh', body, request)).data;
}

export async function requestPasswordRecovery(
  email: string,
  request: Request = apiRequest,
): Promise<string> {
  const body: PasswordRecoveryRequest = { email };
  return (await jsonRequest<MessageResponse>('/auth/password/recovery', body, request)).data
    .message;
}

export async function signOut(session: Session, request: Request = apiRequest): Promise<void> {
  await request<void>('/auth/sign-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
}

export async function updatePassword(
  accessToken: string,
  password: string,
  request: Request = apiRequest,
): Promise<void> {
  const body: PasswordUpdateRequest = { password };
  await request<void>('/auth/password/update', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
}
