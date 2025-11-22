import { getAccountMembers } from '@/lib/account-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InviteUserDialog } from '@/components/invite-user-dialog'
import { MemberActions } from '@/components/member-actions'

export default async function AccountMembersPage() {
    const data = await getAccountMembers()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Account Members</h2>
                    <p className="text-muted-foreground">{data.accountName}</p>
                </div>
                <InviteUserDialog accountId={data.accountId} />
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
