import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                return null; // Logic will be in auth.ts or here if using API
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

            if (isOnAuthPage) {
                if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
                return true
            }

            if (!isLoggedIn) {
                return false
            }

            return true
        },
        async redirect({ url, baseUrl }) {
            // Handle redirect after login
            // Check if url contains callbackUrl parameter
            try {
                const urlObj = new URL(url, baseUrl)
                const callbackUrl = urlObj.searchParams.get('callbackUrl')
                if (callbackUrl) {
                    // If callbackUrl is relative, prepend baseUrl
                    if (callbackUrl.startsWith('/')) {
                        return `${baseUrl}${callbackUrl}`
                    }
                    // If callbackUrl is absolute and from same origin, use it
                    const callbackUrlObj = new URL(callbackUrl, baseUrl)
                    if (callbackUrlObj.origin === baseUrl) {
                        return callbackUrl
                    }
                }
            } catch {
                // Invalid URL, fall through to default
            }

            // If url is a relative path, prepend baseUrl
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`
            }
            // If url is from the same origin, allow it
            try {
                if (new URL(url, baseUrl).origin === baseUrl) {
                    return url
                }
            } catch {
                // Invalid URL, fall through to default
            }
            // Default to dashboard
            return `${baseUrl}/dashboard`
        },
        async session({ session, user, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    },
} satisfies NextAuthConfig
