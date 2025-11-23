'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LeaveAccountDialogProps {
    accountId: string
    accountName: string
    onSuccess: () => void
}

export function LeaveAccountDialog({ accountId, accountName, onSuccess }: LeaveAccountDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLeave = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/account/${accountId}/leave`, {
                method: 'POST',
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to leave account')
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
                Leave
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to leave <strong>{accountName}</strong>? You will lose access to all warranties and data in this account.
                        </DialogDescription>
                    </DialogHeader>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleLeave} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            {loading ? 'Leaving…' : 'Leave Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
