'use client'

// No need for useState in this simplified page
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { useRouter } from 'next/navigation'
import { CreateAccountForm } from '@/components/create-account-form'
import { EditAccountDialog } from '@/components/edit-account-dialog'
import { DeleteAccountDialog } from '@/components/delete-account-dialog'
import { LeaveAccountDialog } from '@/components/leave-account-dialog'
import { useAccount } from '@/components/account-context'

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

                    return (
                        <Card key={acc.id} className="p-4 flex flex-col justify-between">
                            <CardHeader>
                                <CardTitle>{acc.name}</CardTitle>
                                <CardDescription>
                                    {isOwner ? 'Owner' : acc.role ?? 'Member'}
                                </CardDescription>
                            </CardHeader>
                            <div className="flex gap-2 mt-4">
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
