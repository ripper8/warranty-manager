'use client'

// No need for useState in this simplified page
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { useRouter } from 'next/navigation'
import { CreateAccountForm } from '@/components/create-account-form'
import { EditAccountDialog } from '@/components/edit-account-dialog'
import { DeleteAccountDialog } from '@/components/delete-account-dialog'
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
                {accounts.map((acc) => (
                    <Card key={acc.id} className="p-4 flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>{acc.name}</CardTitle>
                            <CardDescription>{acc.role ?? 'Member'}</CardDescription>
                        </CardHeader>
                        <div className="flex gap-2 mt-4">
                            {acc.role === 'ACCOUNT_ADMIN' && (
                                <EditAccountDialog account={acc} onSuccess={refresh} />
                            )}
                            <DeleteAccountDialog accountId={acc.id} onSuccess={refresh} />
                        </div>
                    </Card>
                ))}
            </div>


        </div>
    )
}
