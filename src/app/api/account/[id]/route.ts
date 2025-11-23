import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/account/[id]
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
        where: { id },
        include: { users: { include: { user: true } } },
    });
    if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const isMember = await prisma.accountUser.findFirst({
        where: { accountId: id, userId: session.user.id },
    });
    if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(account);
}

// PATCH /api/account/[id]
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
        return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Must be ACCOUNT_ADMIN or GLOBAL_ADMIN for this account
    const adminRecord = await prisma.accountUser.findFirst({
        where: {
            accountId: id,
            userId: session.user.id,
            role: { in: ['ACCOUNT_ADMIN', 'GLOBAL_ADMIN'] },
        },
    });
    if (!adminRecord) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.account.update({
        where: { id },
        data: { name },
    });
    return NextResponse.json(updated);
}

// DELETE /api/account/[id]
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (account.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
