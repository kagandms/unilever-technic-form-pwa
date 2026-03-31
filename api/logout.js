import { buildClearedAuthCookie } from '../auth.js';

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

  return `${protocol}://${hostHeader}${request.url || '/api/logout'}`;
}

/**
 * @param {import('http').IncomingMessage} request
 * @param {import('http').ServerResponse} response
 */
export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.statusCode = 405;
    response.end('Method not allowed.');
    return;
  }

  response.setHeader(
    'Set-Cookie',
    buildClearedAuthCookie({
      requestUrl: buildRequestUrl(request),
    }),
  );
  response.setHeader('Cache-Control', 'no-store');
  response.statusCode = 204;
  response.end();
}
