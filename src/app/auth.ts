import fetch from './wrapped-fetch';

const listeners = new Set<(loggedIn: boolean) => void>();

function notify(loggedIn: boolean) {
  for (const listener of listeners) {
    listener(loggedIn);
  }
}

export function listen(listener: (loggedIn: boolean) => void) {
  listeners.add(listener);

  const unsubscribe = () => {
    listeners.delete(listener);
  };
  return unsubscribe;
}

export async function handleCallback() {
  const searchParams = new URLSearchParams(window.location.search);
  const oauthToken = searchParams.get('oauth_token');
  const oauthVerifier = searchParams.get('oauth_verifier');
  const sessionId = localStorage.getItem('session_id');

  if (!oauthToken || !oauthVerifier || !sessionId) {
    throw new Error('token, verifier, or session id was falsy');
  }

  const response = await fetch('/token', {
    method: 'POST',
    body: JSON.stringify({ oauthToken, oauthVerifier, sessionId }),
    headers: { 'content-type': 'application/json' },
  });
  const { token } = await response.json();
  localStorage.setItem('token', token);

  notify(true);
}

export function logout() {
  localStorage.removeItem('token');
  notify(false);
}

async function getSessionId() {
  const response = await fetch('/session-id', {
    method: 'POST',
  });
  const json = await response.json();
  return json.sessionId;
}

async function submitSignInForm(sessionId: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${process.env.ORIGIN}/sign-in`;
  form.classList.add('hidden-form');

  const input = document.createElement('input');
  input.name = 'session_id';
  input.value = sessionId;
  form.appendChild(input);

  document.body.appendChild(form);

  form.submit();
}

export async function login() {
  const sessionId = await getSessionId();
  localStorage.setItem('session_id', sessionId);
  await submitSignInForm(sessionId);
}

export function getLoggedIn() {
  // TODO: asynchronously check if logged in cases where the app token could've
  // been revoked
  if (typeof window === 'undefined') {
    return false;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  const [, base64Payload] = token.split('.');

  try {
    const { exp } = JSON.parse(atob(base64Payload));
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUserInfo() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const [, base64Payload] = token.split('.');

  try {
    const { handle, user } = JSON.parse(atob(base64Payload));
    return { handle: handle as string, user: user as number };
  } catch {
    return null;
  }
}

export function getToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('no token');
  }

  return token;
}
