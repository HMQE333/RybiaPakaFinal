const AUTH_HINT_KEY = "rybiapaka:auth-hint";

export function readAuthHint(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(AUTH_HINT_KEY);
    if (value === "1") return true;
    if (value === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function writeAuthHint(isAuthenticated: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_HINT_KEY, isAuthenticated ? "1" : "0");
  } catch {
    // ignore storage errors
  }
}

export function clearAuthHint() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_HINT_KEY);
  } catch {
    // ignore storage errors
  }
}
