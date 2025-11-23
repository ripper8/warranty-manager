import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
        }

        const { name } = await request.json()
        if (!name) {
            return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
        }

        // Create the new account
        const account = await prisma.account.create({
            data: { name, ownerId: session.user.id },
        })

        // Associate the current user as ACCOUNT_ADMIN of the new account
        await prisma.accountUser.create({
            data: {
                userId: session.user.id,
                accountId: account.id,
                role: 'ACCOUNT_ADMIN',
            },
        })

        return NextResponse.json({ account }, { status: 201 })
    } catch (error) {
        console.error('Create account error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create account' },
            { status: 500 }
        )
    }
}
