'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

import { redirect } from 'next/navigation'

export async function getGlobalStats() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
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
            redirect('/dashboard')
        }

        // Get global statistics (excluding System account)
        const totalUsers = await prisma.user.count()
        const totalAccounts = await prisma.account.count({
            where: {
                name: {
                    not: 'System'
                }
            }
        })
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
        // Re-throw redirect errors (NEXT_REDIRECT)
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Get global stats error:', error)
        throw new Error('Failed to fetch global statistics')
    }
}

export async function getAllUsers() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
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
            redirect('/dashboard')
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
            accountsCount: user.accounts.filter(a => a.account.name !== 'System').length,
            warrantiesCount: user.createdWarranties.length,
            accounts: user.accounts
                .filter(a => a.account.name !== 'System')
                .map(a => a.account.name)
        }))
    } catch (error) {
        // Re-throw redirect errors (NEXT_REDIRECT)
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Get all users error:', error)
        throw new Error('Failed to fetch users')
    }
}

export async function getAllAccounts() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
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
            redirect('/dashboard')
        }

        // Get all accounts with statistics (excluding System)
        const accounts = await prisma.account.findMany({
            where: {
                name: {
                    not: 'System'
                }
            },
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
        // Re-throw redirect errors (NEXT_REDIRECT)
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Get all accounts error:', error)
        throw new Error('Failed to fetch accounts')
    }
}
