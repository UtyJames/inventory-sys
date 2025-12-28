import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      role: "CASHIER" | "MANAGER" | "ADMIN";
      name?: string;
      email?: string;
    };
  }

  interface User {
    id: string;
    username?: string;
    role: "CASHIER" | "MANAGER" | "ADMIN";
    name?: string;
    email?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    role: "CASHIER" | "MANAGER" | "ADMIN";
  }
}