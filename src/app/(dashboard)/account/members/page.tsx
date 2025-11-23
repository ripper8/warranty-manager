'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InviteUserDialog } from '@/components/invite-user-dialog'
import { MemberActions } from '@/components/member-actions'
import { useAccount } from '@/components/account-context'
import { Loader2 } from 'lucide-react'

interface Member {
    id: string
    userId: string
    name: string | null
    email: string
    role: string
    joinedAt: Date
    isOwner: boolean
}

interface AccountMembersData {
    accountId: string
    accountName: string
    ownerId: string
    members: Member[]
}

export default function AccountMembersPage() {
    const { selectedAccountId, accounts } = useAccount()
    const [data, setData] = useState<AccountMembersData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMembers = async () => {
        // Don't fetch if "all" is selected
        if (selectedAccountId === 'all') {
            setData(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/account/members?accountId=${selectedAccountId}`)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch members' }))
                throw new Error(errorData.error || 'Failed to fetch members')
            }

            const result = await response.json()
            setData(result)
        } catch (err) {
            console.error('Error fetching members:', err)
            setError(err instanceof Error ? err.message : 'Failed to load members')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMembers()
    }, [selectedAccountId])

    if (selectedAccountId === 'all') {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Account Members</h2>
                    <p className="text-muted-foreground">Select a specific account to manage members</p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            Please select a specific account from the account switcher to view and manage members.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !data) {
        const isPermissionError = error?.includes('permission') || error?.includes('admin')

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Account Members</h2>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <p className={isPermissionError ? "text-muted-foreground" : "text-destructive"}>
                                {error || 'Failed to load members'}
                            </p>
                            {isPermissionError && (
                                <p className="text-sm text-muted-foreground">
                                    Only Account Admins can view and manage members.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Account Members</h2>
                    <p className="text-muted-foreground">{data.accountName}</p>
                </div>
                <InviteUserDialog accountId={data.accountId} onSuccess={fetchMembers} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Members ({data.members.length})</CardTitle>
                    <CardDescription>Manage users in your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{member.name || 'No name'}</p>
                                        {member.isOwner && (
                                            <Badge variant="default">Owner</Badge>
                                        )}
                                        <Badge variant={member.role === 'ACCOUNT_ADMIN' ? 'default' : 'secondary'}>
                                            {member.role === 'ACCOUNT_ADMIN' ? 'Admin' : 'User'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {!member.isOwner && (
                                    <MemberActions
                                        accountUserId={member.id}
                                        currentRole={member.role}
                                        userName={member.name || member.email}
                                        onSuccess={fetchMembers}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
