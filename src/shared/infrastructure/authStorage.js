const AUTH_SESSION_KEY = 'authSession';
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const AUTH_USER_ID_KEY = 'userId';
const AUTH_COMPANY_ID_KEY = 'companyId';

const safeParse = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const unwrapValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object') {
    return value.value ?? value.id ?? value.userId ?? value.companyId ?? null;
  }

  return value;
};

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const extractUserId = (payload) => {
  const user = payload?.user ?? payload;
  return pickFirstDefined(
    unwrapValue(user?.id),
    unwrapValue(user?.userId),
    unwrapValue(user?.userId?.value),
    unwrapValue(user?.id?.value),
    unwrapValue(payload?.userId),
    unwrapValue(payload?.userId?.value),
    unwrapValue(payload?.id),
    unwrapValue(payload?.id?.value)
  );
};

const extractCompanyId = (payload) => {
  const user = payload?.user ?? payload;
  return pickFirstDefined(
    unwrapValue(user?.companyId),
    unwrapValue(user?.companyId?.value),
    unwrapValue(payload?.companyId),
    unwrapValue(payload?.companyId?.value)
  );
};

const extractEmail = (payload) => {
  const user = payload?.user ?? payload;
  return pickFirstDefined(
    unwrapValue(user?.email),
    unwrapValue(user?.email?.value),
    unwrapValue(payload?.email),
    unwrapValue(payload?.email?.value)
  );
};

const extractRole = (payload) => {
  const user = payload?.user ?? payload;
  return pickFirstDefined(unwrapValue(user?.role), unwrapValue(payload?.role));
};

const extractStatus = (payload) => {
  const user = payload?.user ?? payload;
  return pickFirstDefined(unwrapValue(user?.status), unwrapValue(payload?.status));
};

const extractToken = (payload) => {
  return pickFirstDefined(
    payload?.token,
    payload?.accessToken,
    payload?.jwt,
    payload?.jwtToken,
    payload?.authToken,
    payload?.user?.token,
    payload?.user?.accessToken,
    payload?.user?.jwt,
    payload?.user?.jwtToken,
    payload?.user?.authToken
  );
};

export const isJwtLike = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
};

export const normalizeAuthSession = (payload) => {
  if (!payload) {
    return null;
  }

  const token = extractToken(payload);
  const userPayload = payload?.user ?? payload;
  const userId = extractUserId(payload);
  const companyId = extractCompanyId(payload);
  const email = extractEmail(payload);
  const role = extractRole(payload);
  const status = extractStatus(payload);

  const user = userPayload
    ? {
        id: userId,
        userId,
        email,
        role,
        status,
        companyId,
      }
    : null;

  return {
    user,
    token,
    userId,
    companyId,
    email,
    role,
    status,
  };
};

export const persistAuthSession = (payload) => {
  const session = normalizeAuthSession(payload);

  if (!session) {
    clearAuthSession();
    return null;
  }

  if (session.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (session.userId !== undefined && session.userId !== null && session.userId !== '') {
    localStorage.setItem(AUTH_USER_ID_KEY, String(session.userId));
  } else {
    localStorage.removeItem(AUTH_USER_ID_KEY);
  }

  if (session.companyId !== undefined && session.companyId !== null && session.companyId !== '') {
    localStorage.setItem(AUTH_COMPANY_ID_KEY, String(session.companyId));
  } else {
    localStorage.removeItem(AUTH_COMPANY_ID_KEY);
  }

  if (session.user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const readAuthSession = () => {
  const storedSession = safeParse(localStorage.getItem(AUTH_SESSION_KEY));
  if (storedSession) {
    return normalizeAuthSession(storedSession);
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const user = safeParse(localStorage.getItem(AUTH_USER_KEY));
  const userId = localStorage.getItem(AUTH_USER_ID_KEY);
  const companyId = localStorage.getItem(AUTH_COMPANY_ID_KEY);

  if (!token && !user && !userId && !companyId) {
    return null;
  }

  return normalizeAuthSession({
    token,
    user: user
      ? {
          id: userId ?? user.id ?? user.userId ?? null,
          userId: userId ?? user.id ?? user.userId ?? null,
          email: user.email ?? null,
          role: user.role ?? null,
          status: user.status ?? null,
          companyId: companyId ?? user.companyId ?? null,
        }
      : null,
    userId,
    companyId,
  });
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_USER_ID_KEY);
  localStorage.removeItem(AUTH_COMPANY_ID_KEY);
};

export const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredUserId = () => localStorage.getItem(AUTH_USER_ID_KEY);

export const getStoredCompanyId = () => localStorage.getItem(AUTH_COMPANY_ID_KEY);
