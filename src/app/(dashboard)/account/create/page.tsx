'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function CreateAccountPage() {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Account name is required')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/account/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create account')
            }
            // Success – redirect to My Accounts page
            router.push('/account/my-accounts')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create New Account</CardTitle>
                    <CardDescription>Enter a name for the new account. You will become its admin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="account-name">
                                Account Name
                            </label>
                            <Input
                                id="account-name"
                                placeholder="My New Account"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {loading ? 'Creating...' : 'Create Account'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
