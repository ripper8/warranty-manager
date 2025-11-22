import { getAllUsers } from '@/lib/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminUsersPage() {
    const users = await getAllUsers()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage all users in the system</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                                <div className="space-y-1 w-full">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{user.name || 'No name'}</p>
                                        {!user.hasPassword && (
                                            <Badge variant="secondary">OAuth</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span>{user.accountsCount} account(s)</span>
                                        <span className="hidden xs:inline">•</span>
                                        <span>{user.warrantiesCount} warranty(ies)</span>
                                        <span className="hidden xs:inline">•</span>
                                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {user.accounts.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {user.accounts.map((accountName, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {accountName}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="w-full md:w-auto">
                                    {user.hasPassword && (
                                        <div className="w-full md:w-auto">
                                            <ResetPasswordDialog
                                                userId={user.id}
                                                userName={user.name || user.email}
                                                className="w-full md:w-auto"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
