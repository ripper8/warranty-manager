import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    Settings,
    LogOut,
    Shield,
    User
} from "lucide-react"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Check if user is Global Admin
    let isGlobalAdmin = false
    if (session?.user?.id) {
        const adminRole = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: 'GLOBAL_ADMIN'
            }
        })
        isGlobalAdmin = !!adminRole
    }

    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-muted/40 border-r min-h-screen flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold tracking-tight">Warranty Manager</h1>
                    <p className="text-sm text-muted-foreground mt-1">{session?.user?.name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/add">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Add Warranty
                        </Button>
                    </Link>
                    <Link href="/warranties">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <FileText className="h-4 w-4" />
                            My Warranties
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Link href="/account/members">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <User className="h-4 w-4" />
                            Account Members
                        </Button>
                    </Link>
                    {isGlobalAdmin && (
                        <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Shield className="h-4 w-4" />
                                Admin Panel
                            </Button>
                        </Link>
                    )}
                </nav>
                <div className="p-4 border-t">
                    <form action={async () => {
                        'use server';
                        await signOut();
                    }}>
                        <Button variant="outline" className="w-full gap-2">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-8">
                {children}
            </main>
        </div>
    )
}
