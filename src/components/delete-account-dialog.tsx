'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DeleteAccountDialogProps {
    accountId: string
    onSuccess: () => void
}

export function DeleteAccountDialog({ accountId, onSuccess }: DeleteAccountDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/account/${accountId}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete account')
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
            <Button variant="destructive" onClick={() => setOpen(true)}>
                Delete
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this account? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            {loading ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
