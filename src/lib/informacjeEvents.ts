"use client";

const INFO_UPDATE_CHANNEL = "info-entries-updated";

type BrowserGlobal = typeof globalThis & {
  BroadcastChannel?: typeof BroadcastChannel;
  localStorage?: Storage;
  addEventListener?: Window["addEventListener"];
  removeEventListener?: Window["removeEventListener"];
};

const getBrowserGlobal = () =>
  typeof window === "undefined" ? null : (globalThis as BrowserGlobal);

export function broadcastInfoUpdate() {
  const browserGlobal = getBrowserGlobal();
  if (!browserGlobal) return;
  try {
    if (browserGlobal.BroadcastChannel) {
      const channel = new browserGlobal.BroadcastChannel(INFO_UPDATE_CHANNEL);
      channel.postMessage({ type: "info-updated", at: Date.now() });
      channel.close();
      return;
    }
    browserGlobal.localStorage?.setItem(INFO_UPDATE_CHANNEL, String(Date.now()));
  } catch {
    // ignore storage/broadcast errors
  }
}

export function subscribeInfoUpdates(handler: () => void) {
  const browserGlobal = getBrowserGlobal();
  if (!browserGlobal) {
    return () => undefined;
  }

  if (browserGlobal.BroadcastChannel) {
    const channel = new browserGlobal.BroadcastChannel(INFO_UPDATE_CHANNEL);
    const onMessage = (event: MessageEvent) => {
      if (event?.data?.type === "info-updated") {
        handler();
      }
    };
    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === INFO_UPDATE_CHANNEL) {
      handler();
    }
  };
  browserGlobal.addEventListener?.("storage", onStorage);
  return () => {
    browserGlobal.removeEventListener?.("storage", onStorage);
  };
}
