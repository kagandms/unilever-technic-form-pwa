const UNAUTHORIZED_HEADERS = {
  'WWW-Authenticate': 'Basic realm="Unilever Service Form", charset="UTF-8"',
  'Cache-Control': 'no-store',
};

/**
 * Keep local development unblocked, but fail closed on Vercel if auth env vars
 * are missing so deployments are never accidentally exposed.
 *
 * @param {string} requestUrl
 * @returns {boolean}
 */
function isLocalRequest(requestUrl) {
  const { hostname } = new URL(requestUrl);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * @returns {{ username: string; password: string } | null}
 */
function getExpectedCredentials() {
  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

/**
 * @param {string | null} authorizationHeader
 * @returns {{ username: string; password: string } | null}
 */
function parseAuthorizationHeader(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, encodedCredentials] = authorizationHeader.split(' ');
  if (scheme !== 'Basic' || !encodedCredentials) {
    return null;
  }

  try {
    const decodedCredentials = atob(encodedCredentials);
    const separatorIndex = decodedCredentials.indexOf(':');
    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decodedCredentials.slice(0, separatorIndex),
      password: decodedCredentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

/**
 * @returns {Response}
 */
function createUnauthorizedResponse() {
  return new Response('Authentication required.', {
    status: 401,
    headers: UNAUTHORIZED_HEADERS,
  });
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
 * @returns {Response | undefined}
 */
export default function middleware(request) {
  const expectedCredentials = getExpectedCredentials();
  if (!expectedCredentials) {
    if (isLocalRequest(request.url)) {
      return;
    }

    return createMisconfiguredResponse();
  }

  const providedCredentials = parseAuthorizationHeader(
    request.headers.get('authorization'),
  );
  if (!providedCredentials) {
    return createUnauthorizedResponse();
  }

  if (
    providedCredentials.username !== expectedCredentials.username ||
    providedCredentials.password !== expectedCredentials.password
  ) {
    return createUnauthorizedResponse();
  }
}
