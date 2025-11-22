'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
})

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}

export async function register(prevState: string | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return "Invalid fields";
    }

    const { email, password, name } = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return "User already exists.";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            }
        });

        // Create default account for the user
        const account = await prisma.account.create({
            data: {
                name: `${name}'s Account`,
                ownerId: user.id,
            }
        });

        await prisma.accountUser.create({
            data: {
                userId: user.id,
                accountId: account.id,
                role: 'ACCOUNT_ADMIN'
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return "Failed to register user.";
    }

    // Login after registration? Or redirect to login.
    // For now, let's just return success and let the UI redirect.
    // But we can't easily login from here without redirecting to a route that calls signIn.
    // Actually we can call signIn here but it redirects.

    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Registration successful but login failed.'
                default:
                    return 'Something went wrong during login.'
            }
        }
        throw error
    }
}
