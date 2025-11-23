import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, FileText, Calendar } from 'lucide-react'

export default async function MyAccountsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        return <div>Unauthorized</div>
    }

    // Fetch user's accounts with additional info (excluding System)
    const accountUsers = await prisma.accountUser.findMany({
        where: {
            userId: session.user.id,
            account: {
                name: {
                    not: 'System'
                }
            }
        },
        include: {
            account: {
                include: {
                    _count: {
                        select: {
                            users: true,
                            warranties: true
                        }
                    }
                }
            }
        },
        orderBy: {
            account: {
                name: 'asc'
            }
        }
    })

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'GLOBAL_ADMIN':
                return 'Global Admin'
            case 'ACCOUNT_ADMIN':
                return 'Account Admin'
            case 'USER':
                return 'User'
            default:
                return role
        }
    }

    const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
        switch (role) {
            case 'GLOBAL_ADMIN':
                return 'default'
            case 'ACCOUNT_ADMIN':
                return 'default'
            case 'USER':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Accounts</h2>
                <p className="text-muted-foreground">
                    View all accounts you have access to and your role in each
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accountUsers.map((accountUser) => (
                    <Card key={accountUser.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{accountUser.account.name}</CardTitle>
                                </div>
                                <Badge variant={getRoleBadgeVariant(accountUser.role)}>
                                    {getRoleLabel(accountUser.role)}
                                </Badge>
                            </div>
                            <CardDescription>
                                Member since {new Date(accountUser.account.createdAt).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{accountUser.account._count.users} member(s)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>{accountUser.account._count.warranties} warranty(ies)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Created {new Date(accountUser.account.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {accountUsers.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            You are not a member of any accounts yet.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
