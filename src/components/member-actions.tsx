'use client'

import { useState, useTransition } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { updateUserRole, removeUserFromAccount } from '@/lib/account-actions'
import { MoreVertical, Shield, User, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MemberActionsProps {
    accountUserId: string
    currentRole: string
    userName: string
}

export function MemberActions({ accountUserId, currentRole, userName }: MemberActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [showRemoveDialog, setShowRemoveDialog] = useState(false)
    const router = useRouter()

    const handleRoleChange = (newRole: 'USER' | 'ACCOUNT_ADMIN') => {
        startTransition(async () => {
            await updateUserRole({
                accountUserId,
                newRole
            })
            router.refresh()
        })
    }

    const handleRemove = () => {
        startTransition(async () => {
            await removeUserFromAccount(accountUserId)
            setShowRemoveDialog(false)
            router.refresh()
        })
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isPending}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {currentRole === 'USER' ? (
                        <DropdownMenuItem onClick={() => handleRoleChange('ACCOUNT_ADMIN')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => handleRoleChange('USER')}>
                            <User className="mr-2 h-4 w-4" />
                            Make User
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowRemoveDialog(true)}
                        className="text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove from Account
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{userName}</strong> from this account?
                            They will lose access to all warranties in this account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleRemove()
                            }}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
