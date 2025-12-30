// Define Role locally to avoid import issues with generated client during build and to avoid "use server" export errors
export const Role = {
  CASHIER: "CASHIER",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
