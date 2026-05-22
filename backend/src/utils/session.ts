import crypto from 'crypto';
import type { Request, Response } from 'express';

const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function getSessionId(req: Request): string {
  const cookieSessionId = req.cookies?.sessionId;
  if (typeof cookieSessionId === 'string' && cookieSessionId.length > 0) {
    return cookieSessionId;
  }

  const headerSessionId = req.headers['x-session-id'];
  if (typeof headerSessionId === 'string' && headerSessionId.length > 0) {
    return headerSessionId;
  }

  return crypto.randomUUID();
}

export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

/** Keep cookie and x-session-id aligned so checkout and pending-order share the same session. */
export function ensureSessionCookie(req: Request, res: Response): string {
  const sessionId = getSessionId(req);
  const cookieSessionId = req.cookies?.sessionId;
  const headerSessionId = req.headers['x-session-id'];

  if (
    typeof headerSessionId === 'string' &&
    headerSessionId.length > 0 &&
    headerSessionId !== cookieSessionId
  ) {
    setSessionCookie(res, headerSessionId);
    return headerSessionId;
  }

  if (!cookieSessionId) {
    setSessionCookie(res, sessionId);
  }

  return sessionId;
}
