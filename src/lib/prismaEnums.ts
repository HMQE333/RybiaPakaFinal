export const Role = {
  NORMAL: "NORMAL",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RequestStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  CANCELED: "CANCELED",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const ReportCategory = {
  BUG: "BUG",
  USER: "USER",
  SUGGESTION: "SUGGESTION",
  CONTENT: "CONTENT",
  SPAM: "SPAM",
  OTHER: "OTHER",
} as const;
export type ReportCategory =
  (typeof ReportCategory)[keyof typeof ReportCategory];

export const ReportStatus = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
