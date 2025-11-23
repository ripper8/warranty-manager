'use client'

// No need for useState in this simplified page
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAccount } from '@/components/account-context'

export default function ManageAccountsPage() {
    const { accounts } = useAccount()

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-3xl font-bold tracking-tight">Manage Accounts</h2>

            {/* TODO: replace with proper CreateAccountForm component */}
            <Button onClick={() => alert('Create account flow not implemented')}>
                Create Account
            </Button>

            <div className="grid gap-4 md:grid-cols-2">
                {accounts.map((acc) => (
                    <Card key={acc.id} className="p-4 flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>{acc.name}</CardTitle>
                            <CardDescription>{acc.role ?? 'Member'}</CardDescription>
                        </CardHeader>
                        <div className="flex gap-2 mt-4">
                            {acc.role === 'ACCOUNT_ADMIN' && (
                                <Button onClick={() => alert('Edit account not implemented')}>Edit</Button>
                            )}
                            <Button variant="destructive" onClick={() => alert('Delete account not implemented')}>Delete</Button>
                        </div>
                    </Card>
                ))}
            </div>


        </div>
    )
}
