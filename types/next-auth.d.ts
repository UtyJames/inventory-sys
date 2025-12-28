import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string;
    name?: string | null;
    email?: string | null;
    role?: "CASHIER" | "MANAGER" | "ADMIN";
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      username?: string;
      role?: "CASHIER" | "MANAGER" | "ADMIN";
      image?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: "CASHIER" | "MANAGER" | "ADMIN";
  }
}
