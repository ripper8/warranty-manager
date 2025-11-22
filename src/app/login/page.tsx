import LoginForm from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <LoginForm />
        </div>
    )
}
