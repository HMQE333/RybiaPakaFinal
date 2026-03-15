import type { DailyMissionId } from "./missions";

type MissionEventDetail = {
  id?: DailyMissionId;
};

const MISSION_EVENT_NAME = "rybiapaka:mission";

export function emitMissionEvent(id?: DailyMissionId) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MissionEventDetail>(MISSION_EVENT_NAME, { detail: { id } })
  );
}

export function onMissionEvent(handler: (detail: MissionEventDetail) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<MissionEventDetail>;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  };

  window.addEventListener(MISSION_EVENT_NAME, listener as EventListener);
  return () =>
    window.removeEventListener(MISSION_EVENT_NAME, listener as EventListener);
}
