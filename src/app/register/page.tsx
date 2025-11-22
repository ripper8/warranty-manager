import RegisterForm from '@/components/auth/register-form'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <RegisterForm />
        </div>
    )
}
