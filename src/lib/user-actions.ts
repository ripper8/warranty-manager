'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
})

export async function changePassword(data: z.infer<typeof ChangePasswordSchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const validated = ChangePasswordSchema.parse(data)

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        // Check if user has a password (not OAuth only)
        if (!user.password) {
            return { success: false, error: 'Cannot change password for OAuth accounts' }
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(validated.currentPassword, user.password)
        if (!isValidPassword) {
            return { success: false, error: 'Current password is incorrect' }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validated.newPassword, 10)

        // Update password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        })

        return { success: true }
    } catch (error) {
        console.error('Change password error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Failed to change password' }
    }
}

const AdminResetPasswordSchema = z.object({
    userId: z.string(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

export async function adminResetPassword(data: z.infer<typeof AdminResetPasswordSchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Check if current user is Global Admin
        const currentUser = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: 'GLOBAL_ADMIN'
            }
        })

        if (!currentUser) {
            return { success: false, error: 'Only Global Admins can reset passwords' }
        }

        const validated = AdminResetPasswordSchema.parse(data)

        // Get target user
        const targetUser = await prisma.user.findUnique({
            where: { id: validated.userId }
        })

        if (!targetUser) {
            return { success: false, error: 'User not found' }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validated.newPassword, 10)

        // Update password
        await prisma.user.update({
            where: { id: validated.userId },
            data: { password: hashedPassword }
        })

        return { success: true }
    } catch (error) {
        console.error('Admin reset password error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Failed to reset password' }
    }
}
