'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function getGlobalStats() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        // Check if user is Global Admin
        const isGlobalAdmin = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: 'GLOBAL_ADMIN'
            }
        })

        if (!isGlobalAdmin) {
            throw new Error('Only Global Admins can access this')
        }

        // Get global statistics
        const totalUsers = await prisma.user.count()
        const totalAccounts = await prisma.account.count()
        const totalWarranties = await prisma.warrantyItem.count()

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const newUsersLast30Days = await prisma.user.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        const newWarrantiesLast30Days = await prisma.warrantyItem.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        return {
            totalUsers,
            totalAccounts,
            totalWarranties,
            newUsersLast30Days,
            newWarrantiesLast30Days
        }
    } catch (error) {
        console.error('Get global stats error:', error)
        throw new Error('Failed to fetch global statistics')
    }
}

export async function getAllUsers() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        // Check if user is Global Admin
        const isGlobalAdmin = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: 'GLOBAL_ADMIN'
            }
        })

        if (!isGlobalAdmin) {
            throw new Error('Only Global Admins can access this')
        }

        // Get all users with their account memberships
        const users = await prisma.user.findMany({
            include: {
                accounts: {
                    include: {
                        account: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                createdWarranties: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            hasPassword: !!user.password,
            createdAt: user.createdAt,
            accountsCount: user.accounts.length,
            warrantiesCount: user.createdWarranties.length,
            accounts: user.accounts.map(a => a.account.name)
        }))
    } catch (error) {
        console.error('Get all users error:', error)
        throw new Error('Failed to fetch users')
    }
}

export async function getAllAccounts() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        // Check if user is Global Admin
        const isGlobalAdmin = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: 'GLOBAL_ADMIN'
            }
        })

        if (!isGlobalAdmin) {
            throw new Error('Only Global Admins can access this')
        }

        // Get all accounts with statistics
        const accounts = await prisma.account.findMany({
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                warranties: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return accounts.map(account => ({
            id: account.id,
            name: account.name,
            ownerId: account.ownerId,
            createdAt: account.createdAt,
            usersCount: account.users.length,
            warrantiesCount: account.warranties.length,
            users: account.users.map(u => ({
                name: u.user.name || u.user.email,
                role: u.role
            }))
        }))
    } catch (error) {
        console.error('Get all accounts error:', error)
        throw new Error('Failed to fetch accounts')
    }
}
