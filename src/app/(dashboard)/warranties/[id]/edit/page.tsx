import { getWarrantyById } from '@/lib/warranty-actions'
import { notFound } from 'next/navigation'
import EditWarrantyForm from '@/components/edit-warranty-form'

interface EditWarrantyPageProps {
    params: Promise<{ id: string }>
}

export default async function EditWarrantyPage({ params }: EditWarrantyPageProps) {
    const { id } = await params

    let warranty
    try {
        warranty = await getWarrantyById(id)
    } catch (error) {
        notFound()
    }

    return <EditWarrantyForm warranty={warranty} />
}
