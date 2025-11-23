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
import { useAccount } from "@/components/account-context"

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
                            {account.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
