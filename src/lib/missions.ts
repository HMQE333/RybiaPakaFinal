export type DailyMissionId = "post" | "discussion" | "photo";

export type DailyMission = {
  id: DailyMissionId;
  goal: number;
};

export const DAILY_MISSIONS: DailyMission[] = [
  { id: "post", goal: 1 },
  { id: "discussion", goal: 2 },
  { id: "photo", goal: 1 },
];
