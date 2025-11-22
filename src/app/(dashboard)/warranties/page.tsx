import { getWarranties } from '@/lib/warranty-actions'
import WarrantiesList from '@/components/warranties-list'

export default async function WarrantiesPage() {
    const warranties = await getWarranties()

    return <WarrantiesList warranties={warranties} />
}
