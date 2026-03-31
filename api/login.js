import {
  buildAuthCookie,
  createSessionToken,
  getExpectedCredentials,
  normalizeReturnTo,
} from '../auth.js';

/**
 * @param {import('http').IncomingMessage & { body?: unknown }} request
 * @returns {Promise<Record<string, unknown>>}
 */
async function readRequestBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  const bodyChunks = [];
  for await (const chunk of request) {
    bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (bodyChunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(bodyChunks).toString('utf8');
  return JSON.parse(rawBody);
}

/**
 * @param {import('http').IncomingMessage} request
 * @returns {string}
 */
function buildRequestUrl(request) {
  const protocolHeader = request.headers['x-forwarded-proto'];
  const protocol = Array.isArray(protocolHeader)
    ? protocolHeader[0]
    : protocolHeader || 'http';
  const hostHeader = request.headers.host || 'localhost';

  return `${protocol}://${hostHeader}${request.url || '/api/login'}`;
}

/**
 * @param {import('http').ServerResponse} response
 * @param {number} statusCode
 * @param {Record<string, unknown>} body
 */
function writeJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

/**
 * @param {import('http').IncomingMessage & { body?: unknown }} request
 * @param {import('http').ServerResponse} response
 * @returns {Promise<void>}
 */
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    writeJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const expectedCredentials = getExpectedCredentials();
  if (!expectedCredentials) {
    writeJson(response, 500, { message: 'Authentication is not configured.' });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rememberMe = body.rememberMe === true;
    const returnTo = normalizeReturnTo(
      typeof body.returnTo === 'string' ? body.returnTo : '/',
    );

    if (
      username !== expectedCredentials.username ||
      password !== expectedCredentials.password
    ) {
      writeJson(response, 401, { message: 'Kullanici adi veya sifre hatali.' });
      return;
    }

    const requestUrl = buildRequestUrl(request);
    const sessionToken = await createSessionToken(expectedCredentials);

    response.setHeader(
      'Set-Cookie',
      buildAuthCookie({
        rememberMe,
        requestUrl,
        token: sessionToken,
      }),
    );

    writeJson(response, 200, { returnTo });
  } catch {
    writeJson(response, 400, { message: 'Gecersiz istek govdesi.' });
  }
}
