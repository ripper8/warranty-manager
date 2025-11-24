'use client'

// No need for useState in this simplified page
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { useRouter } from 'next/navigation'
import { CreateAccountForm } from '@/components/create-account-form'
import { EditAccountDialog } from '@/components/edit-account-dialog'
import { DeleteAccountDialog } from '@/components/delete-account-dialog'
import { LeaveAccountDialog } from '@/components/leave-account-dialog'
import { useAccount } from '@/components/account-context'
import { Crown, ShieldCheck, UserRound } from 'lucide-react'

export default function ManageAccountsPage() {
    const { accounts } = useAccount()
    const router = useRouter()
    const refresh = () => router.refresh()

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-3xl font-bold tracking-tight">Manage Accounts</h2>

            {/* Create new account form */}
            <CreateAccountForm onSuccess={refresh} />

            <div className="grid gap-4 md:grid-cols-2">
                {accounts.map((acc) => {
                    const isOwner = acc.ownerId === acc.sessionUserId
                    const isAdmin = acc.role === 'ACCOUNT_ADMIN' || acc.role === 'GLOBAL_ADMIN'
                    const isGlobalAdmin = acc.role === 'GLOBAL_ADMIN'

                    const RoleIcon = isOwner ? Crown : isAdmin ? ShieldCheck : UserRound
                    const roleVariant = isOwner
                        ? 'default'
                        : isAdmin
                          ? 'secondary'
                          : 'outline'
                    const roleLabel = isOwner
                        ? 'Owner'
                        : isGlobalAdmin
                          ? 'Global admin'
                          : acc.role === 'ACCOUNT_ADMIN'
                            ? 'Account admin'
                            : 'Member'
                    const roleDescription = isOwner
                        ? 'Full control over members, settings and billing.'
                        : isAdmin
                          ? 'Can manage members and account details.'
                          : 'Can view warranties and participate in the account.'

                    return (
                        <Card key={acc.id} className="p-4 flex flex-col justify-between gap-4">
                            <CardHeader className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl">{acc.name}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {roleDescription}
                                        </CardDescription>
                                    </div>

                                    <Badge variant={roleVariant as 'default' | 'secondary' | 'outline'}>
                                        <RoleIcon className="h-3.5 w-3.5" />
                                        {roleLabel}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <div className="flex flex-wrap gap-2">
                                {/* Edit - only for admins or owner */}
                                {(isAdmin || isOwner) && (
                                    <EditAccountDialog account={acc} onSuccess={refresh} />
                                )}

                                {/* Delete - only for owner */}
                                {isOwner && (
                                    <DeleteAccountDialog accountId={acc.id} onSuccess={refresh} />
                                )}

                                {/* Leave - only for non-owners */}
                                {!isOwner && (
                                    <LeaveAccountDialog
                                        accountId={acc.id}
                                        accountName={acc.name}
                                        onSuccess={refresh}
                                    />
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
