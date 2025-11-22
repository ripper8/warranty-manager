import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ChangePasswordForm from '@/components/change-password-form'

export default async function SettingsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        return null
    }

    // Check if user has a password (not OAuth only)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            password: true,
            name: true,
            email: true
        }
    })

    const hasPassword = !!user?.password

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            <ChangePasswordForm hasPassword={hasPassword} />
        </div>
    )
}
