import {
  LOGIN_PATH,
  getExpectedCredentials,
  hasValidSession,
  isLocalRequest,
  normalizeReturnTo,
} from './auth.js';

const PUBLIC_PATHS = new Set([
  LOGIN_PATH,
  '/api/login',
  '/api/logout',
  '/manifest.json',
  '/sw.js',
  '/unilever_logo.webp',
  '/kase.jpg',
  '/logo.png',
]);

/**
 * @param {Request} request
 * @returns {boolean}
 */
function isHtmlNavigation(request) {
  if (request.method !== 'GET') {
    return false;
  }

  const acceptHeader = request.headers.get('accept') || '';
  return acceptHeader.includes('text/html');
}

/**
 * @param {URL} requestUrl
 * @returns {boolean}
 */
function isPublicPath(requestUrl) {
  return PUBLIC_PATHS.has(requestUrl.pathname) || requestUrl.pathname.startsWith('/icons/');
}

/**
 * @param {Request} request
 * @returns {Response}
 */
function createRedirectToLoginResponse(request) {
  const currentUrl = new URL(request.url);
  const loginUrl = new URL(LOGIN_PATH, request.url);
  const currentPath = `${currentUrl.pathname}${currentUrl.search}`;

  loginUrl.searchParams.set('returnTo', normalizeReturnTo(currentPath));

  return Response.redirect(loginUrl, 307);
}

/**
 * @returns {Response}
 */
function createMisconfiguredResponse() {
  return new Response('Authentication is not configured.', {
    status: 500,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * @param {Request} request
 * @returns {Promise<Response | undefined>}
 */
export default async function middleware(request) {
  const expectedCredentials = getExpectedCredentials();
  if (!expectedCredentials) {
    if (isLocalRequest(request.url)) {
      return;
    }

    return createMisconfiguredResponse();
  }

  const requestUrl = new URL(request.url);
  const isAuthenticated = await hasValidSession({
    cookieHeader: request.headers.get('cookie'),
    expectedCredentials,
  });

  if (requestUrl.pathname === LOGIN_PATH) {
    if (!isAuthenticated) {
      return;
    }

    const returnTo = normalizeReturnTo(requestUrl.searchParams.get('returnTo'));
    return Response.redirect(new URL(returnTo, request.url), 302);
  }

  if (isPublicPath(requestUrl)) {
    return;
  }

  if (isAuthenticated) {
    return;
  }

  if (isHtmlNavigation(request)) {
    return createRedirectToLoginResponse(request);
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
