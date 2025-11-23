import { NextRequest, NextResponse } from 'next/server'
import { getAccountMembers } from '@/lib/account-actions'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // -------------------------------------------------
        // 1️⃣  Parse query string
        // -------------------------------------------------
        const { searchParams } = new URL(request.url)
        const accountId = searchParams.get('accountId')

        if (!accountId) {
            return NextResponse.json(
                { error: 'accountId is required' },
                { status: 400 }
            )
        }

        // -------------------------------------------------
        // 2️⃣  Verify that the caller is authenticated
        // -------------------------------------------------
        const session = await auth()
        if (!session?.user?.id) {
            // 401 – not logged in
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
        }

        // -------------------------------------------------
        // 3️⃣  Authorisation – must be ACCOUNT_ADMIN or GLOBAL_ADMIN
        // -------------------------------------------------
        const adminRecord = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                accountId,
                role: { in: ['ACCOUNT_ADMIN', 'GLOBAL_ADMIN'] },
            },
        })

        if (!adminRecord) {
            // 403 – user does not have rights for this account
            return NextResponse.json(
                {
                    error:
                        'You do not have permission to view members of this account',
                },
                { status: 403 }
            )
        }

        // -------------------------------------------------
        // 4️⃣  All checks passed → fetch the members
        // -------------------------------------------------
        const data = await getAccountMembers(accountId)
        return NextResponse.json(data)
    } catch (error) {
        console.error('API error:', error)

        // Preserve the original “fallback” handling for unexpected errors
        if (error instanceof Error) {
            if (error.message.includes('Unauthorized')) {
                return NextResponse.json(
                    { error: 'You do not have permission to view members of this account' },
                    { status: 403 }
                )
            }
            if (error.message.includes('No account found')) {
                return NextResponse.json(
                    { error: 'You are not an admin of any account' },
                    { status: 403 }
                )
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch members' },
            { status: 500 }
        )
    }
}