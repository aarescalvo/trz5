import { SignJWT, jwtVerify } from 'jose'

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'produccion4z-secret-key-change-in-production'
)

const JWT_EXPIRES_IN = '8h' // 8 hours session
const COOKIE_NAME = 'session_token'

export interface SessionPayload {
  operadorId: string
  nombre: string
  usuario: string
  rol: string
  permisos: Record<string, boolean>
}

/**
 * Create a signed JWT token with operator session data
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ 
    operadorId: payload.operadorId,
    nombre: payload.nombre,
    usuario: payload.usuario,
    rol: payload.rol,
    permisos: payload.permisos
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

/**
 * Verify and decode a JWT token
 * Returns the payload or null if invalid/expired
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch (error) {
    // Token expired, invalid, or malformed
    return null
  }
}

/**
 * Get cookie configuration for session token
 */
export function getSessionCookieConfig() {
  return {
    name: COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours in seconds
    }
  }
}

/**
 * Create a logout cookie (expires immediately)
 */
export function getLogoutCookieConfig() {
  return {
    name: COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Expire immediately
    }
  }
}
