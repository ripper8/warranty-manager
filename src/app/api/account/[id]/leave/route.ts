import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/account/[id]/leave - Leave an account (remove yourself as a member)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Check if account exists
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Cannot leave if you are the owner
    if (account.ownerId === session.user.id) {
        return NextResponse.json({ error: 'Cannot leave account you own. Delete it instead.' }, { status: 403 });
    }

    // Check if user is a member
    const membership = await prisma.accountUser.findFirst({
        where: { accountId: id, userId: session.user.id },
    });
    if (!membership) {
        return NextResponse.json({ error: 'You are not a member of this account' }, { status: 403 });
    }

    // Remove the user from the account
    await prisma.accountUser.delete({
        where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
}
