export type AuthEventType = "login" | "logout";

type AuthEventDetail = {
  type: AuthEventType;
};

const AUTH_EVENT_NAME = "rybiapaka:auth";

export function emitAuthEvent(type: AuthEventType) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthEventDetail>(AUTH_EVENT_NAME, { detail: { type } })
  );
}

export function onAuthEvent(handler: (detail: AuthEventDetail) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AuthEventDetail>;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(AUTH_EVENT_NAME, listener as EventListener);
}
