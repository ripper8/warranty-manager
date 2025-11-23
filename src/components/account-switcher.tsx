'use client'

import * as React from "react"
import { Building2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAccount } from "@/components/account-context"

const getRoleLabel = (role?: string) => {
    switch (role) {
        case 'GLOBAL_ADMIN':
            return 'Global Admin'
        case 'ACCOUNT_ADMIN':
            return 'Admin'
        case 'USER':
            return 'User'
        default:
            return ''
    }
}

const getRoleBadgeVariant = (role?: string): "default" | "secondary" | "outline" => {
    switch (role) {
        case 'GLOBAL_ADMIN':
            return 'default'
        case 'ACCOUNT_ADMIN':
            return 'default'
        case 'USER':
            return 'secondary'
        default:
            return 'outline'
    }
}

export function AccountSwitcher() {
    const { accounts, selectedAccountId, setSelectedAccountId } = useAccount()

    return (
        <div className="mb-4 px-2">
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 opacity-50" />
                        <SelectValue placeholder="Select account" />
                    </div>
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="pr-2">
                            <div className="flex flex-col items-start gap-1 w-full min-w-0">
                                <span className="truncate w-full text-sm">{account.name}</span>
                                {account.role && (
                                    <Badge variant={getRoleBadgeVariant(account.role)} className="text-[10px] px-1.5 py-0.5 h-4">
                                        {getRoleLabel(account.role)}
                                    </Badge>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
