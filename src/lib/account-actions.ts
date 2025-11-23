'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const InviteUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    accountId: z.string(),
    role: z.enum(['ACCOUNT_ADMIN', 'USER'])
})

export async function inviteUser(data: z.infer<typeof InviteUserSchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const validated = InviteUserSchema.parse(data)

        // Check if current user is Account Admin or Global Admin for this account
        const currentUserRole = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                OR: [
                    { accountId: validated.accountId, role: 'ACCOUNT_ADMIN' },
                    { role: 'GLOBAL_ADMIN' }
                ]
            }
        })

        if (!currentUserRole) {
            return { success: false, error: 'Only Account Admins can invite users' }
        }

        // Check if user exists
        let targetUser = await prisma.user.findUnique({
            where: { email: validated.email }
        })

        if (!targetUser) {
            return { success: false, error: 'User not found. User must register first.' }
        }

        // Check if user is already in this account
        const existingMembership = await prisma.accountUser.findUnique({
            where: {
                accountId_userId: {
                    accountId: validated.accountId,
                    userId: targetUser.id
                }
            }
        })

        if (existingMembership) {
            return { success: false, error: 'User is already a member of this account' }
        }

        // Add user to account
        await prisma.accountUser.create({
            data: {
                accountId: validated.accountId,
                userId: targetUser.id,
                role: validated.role
            }
        })

        revalidatePath('/account/members')

        return { success: true }
    } catch (error) {
        console.error('Invite user error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Failed to invite user' }
    }
}

const UpdateUserRoleSchema = z.object({
    accountUserId: z.string(),
    newRole: z.enum(['ACCOUNT_ADMIN', 'USER'])
})

export async function updateUserRole(data: z.infer<typeof UpdateUserRoleSchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const validated = UpdateUserRoleSchema.parse(data)

        // Get the account user record
        const accountUser = await prisma.accountUser.findUnique({
            where: { id: validated.accountUserId },
            include: { account: true }
        })

        if (!accountUser) {
            return { success: false, error: 'User membership not found' }
        }

        // Check if current user is Account Admin or Global Admin for this account
        const currentUserRole = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                OR: [
                    { accountId: accountUser.accountId, role: 'ACCOUNT_ADMIN' },
                    { role: 'GLOBAL_ADMIN' }
                ]
            }
        })

        if (!currentUserRole) {
            return { success: false, error: 'Only Account Admins can change roles' }
        }

        // Update role
        await prisma.accountUser.update({
            where: { id: validated.accountUserId },
            data: { role: validated.newRole }
        })

        revalidatePath('/account/members')

        return { success: true }
    } catch (error) {
        console.error('Update user role error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Failed to update role' }
    }
}

export async function removeUserFromAccount(accountUserId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Get the account user record
        const accountUser = await prisma.accountUser.findUnique({
            where: { id: accountUserId },
            include: { account: true }
        })

        if (!accountUser) {
            return { success: false, error: 'User membership not found' }
        }

        // Check if current user is Account Admin or Global Admin for this account
        const currentUserRole = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                OR: [
                    { accountId: accountUser.accountId, role: 'ACCOUNT_ADMIN' },
                    { role: 'GLOBAL_ADMIN' }
                ]
            }
        })

        if (!currentUserRole) {
            return { success: false, error: 'Only Account Admins can remove users' }
        }

        // Don't allow removing the account owner
        if (accountUser.userId === accountUser.account.ownerId) {
            return { success: false, error: 'Cannot remove account owner' }
        }

        // Remove user from account
        await prisma.accountUser.delete({
            where: { id: accountUserId }
        })

        revalidatePath('/account/members')

        return { success: true }
    } catch (error) {
        console.error('Remove user from account error:', error)
        return { success: false, error: 'Failed to remove user' }
    }
}

export async function getAccountMembers(accountId?: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        let targetAccountId = accountId

        // If no accountId provided, get user's first account where they are admin
        if (!targetAccountId) {
            const userAccount = await prisma.accountUser.findFirst({
                where: {
                    userId: session.user.id,
                    role: { in: ['ACCOUNT_ADMIN', 'GLOBAL_ADMIN'] }
                }
            })

            if (!userAccount) {
                throw new Error('No account found')
            }
            targetAccountId = userAccount.accountId
        }

        // Verify user has admin access to this account
        const hasAccess = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                OR: [
                    { accountId: targetAccountId, role: 'ACCOUNT_ADMIN' },
                    { role: 'GLOBAL_ADMIN' }
                ]
            }
        })

        if (!hasAccess) {
            throw new Error('Unauthorized to view this account')
        }

        // Get all members of this account
        const members = await prisma.accountUser.findMany({
            where: {
                accountId: targetAccountId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true
                    }
                },
                account: {
                    select: {
                        name: true,
                        ownerId: true
                    }
                }
            },
            orderBy: {
                user: {
                    createdAt: 'desc'
                }
            }
        })

        return {
            accountId: targetAccountId,
            accountName: members[0]?.account.name || '',
            ownerId: members[0]?.account.ownerId || '',
            members: members.map(m => ({
                id: m.id,
                userId: m.user.id,
                name: m.user.name,
                email: m.user.email,
                role: m.role,
                joinedAt: m.user.createdAt,
                isOwner: m.user.id === members[0]?.account.ownerId
            }))
        }
    } catch (error) {
        console.error('Get account members error:', error)
        throw new Error('Failed to fetch account members')
    }
}
