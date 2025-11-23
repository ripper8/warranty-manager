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
                <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between gap-2 w-full">
                                <span className="truncate">{account.name}</span>
                                {account.role && (
                                    <Badge variant={getRoleBadgeVariant(account.role)} className="text-xs shrink-0">
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
