import { getAllAccounts } from '@/lib/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminAccountsPage() {
    const accounts = await getAllAccounts()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Account Management</h2>
                    <p className="text-muted-foreground">View all accounts in the system</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Accounts ({accounts.length})</CardTitle>
                    <CardDescription>Organizations and their members</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <div key={account.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="font-medium text-lg">{account.name}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{account.usersCount} member(s)</span>
                                            <span>•</span>
                                            <span>{account.warrantiesCount} warranty(ies)</span>
                                            <span>•</span>
                                            <span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {account.users.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Members:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {account.users.map((user, idx) => (
                                                <div key={idx} className="flex items-center gap-1">
                                                    <Badge variant="outline">{user.name}</Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
