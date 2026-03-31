export const AUTH_COOKIE_NAME = 'unilever_auth';
export const LOGIN_PATH = '/login.html';
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

/**
 * @param {string} requestUrl
 * @returns {boolean}
 */
export function isLocalRequest(requestUrl) {
  const { hostname } = new URL(requestUrl);
  return LOCAL_HOSTNAMES.has(hostname);
}

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ username: string; password: string } | null}
 */
export function getExpectedCredentials(env = process.env) {
  const username = env.BASIC_AUTH_USER;
  const password = env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

/**
 * @param {string | null} cookieHeader
 * @returns {Record<string, string>}
 */
export function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((cookieMap, cookieChunk) => {
    const [rawName, ...rawValueParts] = cookieChunk.trim().split('=');
    if (!rawName || rawValueParts.length === 0) {
      return cookieMap;
    }

    cookieMap[rawName] = rawValueParts.join('=');
    return cookieMap;
  }, {});
}

/**
 * @param {string} value
 * @returns {Promise<string>}
 */
async function sha256Hex(value) {
  const encodedValue = new TextEncoder().encode(value);
  const digestBuffer = await crypto.subtle.digest('SHA-256', encodedValue);
  const digestBytes = Array.from(new Uint8Array(digestBuffer));

  return digestBytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * @param {{ username: string; password: string }} credentials
 * @returns {Promise<string>}
 */
export async function createSessionToken(credentials) {
  const digest = await sha256Hex(
    `${credentials.username}:${credentials.password}`,
  );

  return `${encodeURIComponent(credentials.username)}.${digest}`;
}

/**
 * @param {{ cookieHeader: string | null; expectedCredentials: { username: string; password: string } }} options
 * @returns {Promise<boolean>}
 */
export async function hasValidSession(options) {
  const cookies = parseCookies(options.cookieHeader);
  const currentToken = cookies[AUTH_COOKIE_NAME];
  if (!currentToken) {
    return false;
  }

  const expectedToken = await createSessionToken(options.expectedCredentials);
  return currentToken === expectedToken;
}

/**
 * @param {{ rememberMe: boolean; requestUrl: string; token: string }} options
 * @returns {string}
 */
export function buildAuthCookie(options) {
  const cookieSegments = [
    `${AUTH_COOKIE_NAME}=${options.token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (!isLocalRequest(options.requestUrl)) {
    cookieSegments.push('Secure');
  }

  if (options.rememberMe) {
    cookieSegments.push(`Max-Age=${REMEMBER_ME_MAX_AGE}`);
  }

  return cookieSegments.join('; ');
}

/**
 * @param {{ requestUrl: string }} options
 * @returns {string}
 */
export function buildClearedAuthCookie(options) {
  const cookieSegments = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (!isLocalRequest(options.requestUrl)) {
    cookieSegments.push('Secure');
  }

  return cookieSegments.join('; ');
}

/**
 * @param {string | null} returnTo
 * @returns {string}
 */
export function normalizeReturnTo(returnTo) {
  if (!returnTo || !returnTo.startsWith('/')) {
    return '/';
  }

  if (returnTo.startsWith('//')) {
    return '/';
  }

  return returnTo;
}
