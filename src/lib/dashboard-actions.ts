'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function getDashboardStats() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        // Get user's account IDs
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true }
        })

        const accountIds = userAccounts.map(ua => ua.accountId)

        // Get all warranties for user's accounts
        const warranties = await prisma.warrantyItem.findMany({
            where: {
                accountId: { in: accountIds }
            },
            include: {
                documents: true,
                account: {
                    select: {
                        name: true
                    }
                }
            }
        })

        const now = new Date()

        // Calculate statistics
        const total = warranties.length

        const active = warranties.filter(w => {
            if (!w.expiryDate) return false
            const daysUntilExpiry = Math.floor((w.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry > 30
        }).length

        const expiringSoon = warranties.filter(w => {
            if (!w.expiryDate) return false
            const daysUntilExpiry = Math.floor((w.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30
        }).length

        const expired = warranties.filter(w => {
            if (!w.expiryDate) return false
            return w.expiryDate.getTime() < now.getTime()
        }).length

        // Get recent warranties (last 5)
        const recentWarranties = warranties
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5)
            .map(w => ({
                id: w.id,
                title: w.title,
                brand: w.brand,
                category: w.category,
                createdAt: w.createdAt,
                expiryDate: w.expiryDate,
                documentsCount: w.documents.length,
                accountName: w.account.name
            }))

        // Calculate category breakdown
        const categoryBreakdown = warranties.reduce((acc, w) => {
            const category = w.category || 'Uncategorized'
            acc[category] = (acc[category] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            total,
            active,
            expiringSoon,
            expired,
            recentWarranties,
            categoryBreakdown
        }
    } catch (error) {
        console.error('Get dashboard stats error:', error)
        throw new Error('Failed to fetch dashboard statistics')
    }
}
