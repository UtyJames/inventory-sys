import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/auth/sign-in",
        error: "/auth/sign-in",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
            const isPublicRoute = ["/", "/auth/sign-in", "/auth/sign-up"].includes(nextUrl.pathname);
            const isAuthRoute = nextUrl.pathname.startsWith("/auth");

            if (isApiAuthRoute) return true;

            if (isAuthRoute) {
                if (isLoggedIn) return Response.redirect(new URL("/inventory", nextUrl));
                return true;
            }

            if (!isLoggedIn && !isPublicRoute) {
                return false; // Redirect to sign-in
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.image = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.role = token.role as "CASHIER" | "MANAGER" | "ADMIN";
                session.user.image = token.image as string;
            }
            return session;
        },
    },
    providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
