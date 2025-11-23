import { NextRequest, NextResponse } from 'next/server'
import { getAccountMembers } from '@/lib/account-actions'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const accountId = searchParams.get('accountId')

        if (!accountId) {
            return NextResponse.json(
                { error: 'accountId is required' },
                { status: 400 }
            )
        }

        const data = await getAccountMembers(accountId)
        return NextResponse.json(data)
    } catch (error) {
        console.error('API error:', error)

        // Check if it's an authorization error
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
