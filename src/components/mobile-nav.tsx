'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    Settings,
    LogOut,
    Shield,
    User,
    Menu,
    X,
    Building2
} from 'lucide-react'
import { AccountSwitcher } from '@/components/account-switcher'

interface MobileNavProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    } | undefined
    isGlobalAdmin: boolean
    onSignOut: () => Promise<void>
}

export function MobileNav({ user, isGlobalAdmin, onSignOut }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const toggleMenu = () => setIsOpen(!isOpen)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement

            // If click is inside the mobile nav container – do nothing
            if (menuRef.current && menuRef.current.contains(target)) return

            // If click is inside any Radix Select element (rendered in a portal), ignore it
            // This includes: trigger, content, viewport, item, etc.
            if (
                target.closest('[data-radix-select-trigger]') ||
                target.closest('[data-radix-select-content]') ||
                target.closest('[data-radix-select-viewport]') ||
                target.closest('[data-radix-select-item]') ||
                target.closest('[role="listbox"]')
            ) {
                return
            }

            // Otherwise close the menu
            setIsOpen(false)
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div className="md:hidden border-b bg-background sticky top-0 z-50" ref={menuRef}>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight">Warranty Manager</h1>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" onClick={toggleMenu}>
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-background border-b shadow-lg p-4 space-y-4 animate-in slide-in-from-top-5">
                    <div className="flex flex-col space-y-2">
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                            Signed in as {user?.name}
                        </div>
                        <AccountSwitcher />
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/add" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Add Warranty
                            </Button>
                        </Link>
                        <Link href="/warranties" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <FileText className="h-4 w-4" />
                                My Warranties
                            </Button>
                        </Link>
                        <Link href="/account/my-accounts" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Building2 className="h-4 w-4" />
                                My Accounts
                            </Button>
                        </Link>
                        <Link href="/account/manage" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Building2 className="h-4 w-4" />
                                Manage Accounts
                            </Button>
                        </Link>
                        <Link href="/settings" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                        <Link href="/account/members" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <User className="h-4 w-4" />
                                Account Members
                            </Button>
                        </Link>
                        {isGlobalAdmin && (
                            <Link href="/admin" onClick={() => setIsOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <Shield className="h-4 w-4" />
                                    Admin Panel
                                </Button>
                            </Link>
                        )}
                        <div className="pt-2 border-t">
                            <form action={onSignOut}>
                                <Button variant="outline" className="w-full gap-2">
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
