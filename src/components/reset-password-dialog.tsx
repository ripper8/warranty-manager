'use client'

import { useState, useTransition } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminResetPassword } from '@/lib/user-actions'
import { Key, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResetPasswordDialogProps {
    userId: string
    userName: string
}

export function ResetPasswordDialog({ userId, userName }: ResetPasswordDialogProps) {
    const [open, setOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    const handleReset = () => {
        setError('')

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        startTransition(async () => {
            const result = await adminResetPassword({
                userId,
                newPassword
            })

            if (result.success) {
                setOpen(false)
                setNewPassword('')
                router.refresh()
            } else {
                setError(result.error || 'Failed to reset password')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for <strong>{userName}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            disabled={isPending}
                            minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">At least 6 characters</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleReset} disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
