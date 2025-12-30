"use server";

import { executeAction } from "@/lib/executeAction";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/types";

export async function signInAction(formData: FormData) {
  return await executeAction({
    actionFn: async () => {
     await signIn("credentials", {
       ...Object.fromEntries(formData),
       redirectTo: "/",
     }) 
    },
    successMessage: "Welcome back! Redirecting...",
  })
}

export async function signUpAction(formData: FormData) {
  return await executeAction({
    actionFn: async () => {
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string | null;
      const roleStr = formData.get("role") as string;

      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      const role = (roleStr?.toUpperCase() || "CASHIER") as Role;
      if (!Object.values(Role).includes(role)) {
        throw new Error("Invalid role selected");
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name: name || username,
          role,
        },
      });

      // Automatically sign in after signup
      await signIn("credentials", {
        username,
        password,
        redirectTo: "/",
      });
    },
    successMessage: "Account created successfully! Redirecting...",
  })
}
