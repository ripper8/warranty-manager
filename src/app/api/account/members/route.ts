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
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch members' },
            { status: 500 }
        )
    }
}
