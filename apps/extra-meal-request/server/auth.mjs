import { randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'iai_session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const issuer = 'iai-request-center';
const audience = 'iai-request-center-web';
const configuredSecret = process.env.JWT_SECRET;
if (configuredSecret && Buffer.byteLength(configuredSecret) < 32) {
  throw new Error('JWT_SECRET must be at least 32 bytes.');
}
if (process.env.NODE_ENV === 'production' && !configuredSecret) {
  throw new Error('JWT_SECRET must be configured in production.');
}
const secret = new TextEncoder().encode(configuredSecret ?? randomBytes(32).toString('base64url'));

export async function createSessionToken(userId, sessionId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(String(userId))
    .setJti(sessionId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + Math.floor(SESSION_TTL_MS / 1000))
    .sign(secret);
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer,
      audience,
    });
    if (
      !payload.sub
      || !/^[1-9]\d*$/.test(payload.sub)
      || !payload.jti
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.jti)
    ) {
      return null;
    }
    return { userId: payload.sub, sessionId: payload.jti };
  } catch {
    return null;
  }
}

export function readSessionToken(req) {
  const prefix = `${SESSION_COOKIE_NAME}=`;
  const cookie = String(req.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie?.slice(prefix.length) || null;
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  });
}

export function createAuthMiddleware(pool) {
  return async (req, res, next) => {
    const token = readSessionToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required.', code: 'AUTH_REQUIRED' });
    const claims = await verifySessionToken(token);
    if (!claims) return res.status(401).json({ error: 'Session is invalid or expired.', code: 'AUTH_REQUIRED' });

    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.department, u.job_title,
              u.role, u.vehicle_admin, u.meal_admin, u.approver_doa, u.must_change_password
       FROM auth_sessions AS s
       JOIN users AS u ON u.id = s.user_id
       WHERE s.id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL
         AND s.expires_at > NOW() AND u.is_active = TRUE`,
      [claims.sessionId, claims.userId],
    );
    const row = rows[0];
    if (!row) return res.status(401).json({ error: 'Session is invalid or expired.', code: 'AUTH_REQUIRED' });

    req.user = {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      department: row.department,
      jobTitle: row.job_title,
      role: row.role,
      vehicleAdmin: row.vehicle_admin,
      mealAdmin: row.meal_admin,
      approverDoa: row.approver_doa,
      mustChangePassword: row.must_change_password,
      sessionId: claims.sessionId,
    };

    const allowedDuringPasswordChange = req.method === 'GET' && req.path === '/session'
      || req.method === 'POST' && (req.path === '/auth/change-password' || req.path === '/auth/logout');
    if (req.user.mustChangePassword && !allowedDuringPasswordChange) {
      return res.status(403).json({
        error: 'Change your password before continuing.',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }
    next();
  };
}
