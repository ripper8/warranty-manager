'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface CreateAccountFormProps {
    onSuccess: () => void
}

export function CreateAccountForm({ onSuccess }: CreateAccountFormProps) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
            if (!res.ok) throw new Error(data.error || 'Failed to create account')
            onSuccess()
            setName('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Create New Account</CardTitle>
                <CardDescription>Enter a name for the new account. You will become its admin.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Account name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                    />
                    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        {loading ? 'Creating…' : 'Create Account'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
