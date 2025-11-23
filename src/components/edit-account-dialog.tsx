'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface EditAccountDialogProps {
    account: { id: string; name: string }
    onSuccess: () => void
}

export function EditAccountDialog({ account, onSuccess }: EditAccountDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(account.name)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/account/${account.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update account')
            setOpen(false)
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                Edit
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                        <DialogDescription>Change the name of the account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            {loading ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
