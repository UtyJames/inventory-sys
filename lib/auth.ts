import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    session: {
        strategy: "jwt",
    },
    providers: [
        Credentials({
            authorize: async (credentials) => {
                try {
                    const { username, password } = credentialsSchema.parse(credentials);
                    
                    const user = await prisma.user.findUnique({
                        where: { username },
                    });
                    
                    if (!user || !user.password) {
                        return null;
                    }
                    
                    const isPasswordValid = await bcrypt.compare(password, user.password);
                    
                    if (!isPasswordValid) {
                        return null;
                    }
                    
                    return {
                        id: user.id,
                        name: user.name ?? undefined,
                        username: user.username ?? undefined,
                        email: user.email ?? undefined,
                        role: user.role as "CASHIER" | "MANAGER" | "ADMIN",
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
});
