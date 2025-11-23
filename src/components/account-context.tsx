'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Account {
    id: string
    name: string
    role?: string
}

interface AccountContextType {
    selectedAccountId: string
    setSelectedAccountId: (id: string) => void
    accounts: Account[]
    isLoading: boolean
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({
    children,
    accounts
}: {
    children: React.ReactNode
    accounts: Account[]
}) {
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Load from local storage on mount
        const saved = localStorage.getItem('selectedAccountId')
        if (saved) {
            // Verify the saved account still exists or is 'all'
            if (saved === 'all' || accounts.some(a => a.id === saved)) {
                setSelectedAccountId(saved)
            }
        }
        setIsLoading(false)
    }, [accounts])

    const handleSetAccount = (id: string) => {
        setSelectedAccountId(id)
        localStorage.setItem('selectedAccountId', id)
    }

    return (
        <AccountContext.Provider value={{
            selectedAccountId,
            setSelectedAccountId: handleSetAccount,
            accounts,
            isLoading
        }}>
            {children}
        </AccountContext.Provider>
    )
}

export function useAccount() {
    const context = useContext(AccountContext)
    if (context === undefined) {
        throw new Error('useAccount must be used within an AccountProvider')
    }
    return context
}
