import { getWarrantyById } from '@/lib/warranty-actions'
import { getFileUrl } from '@/lib/storage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, FileText, Image as ImageIcon, Receipt, Edit } from 'lucide-react'
import { notFound } from 'next/navigation'
import { DeleteWarrantyButton } from '@/components/delete-warranty-button'

interface WarrantyDetailsPageProps {
    params: Promise<{ id: string }>;
}

export default async function WarrantyDetailsPage({ params }: WarrantyDetailsPageProps) {
    const { id } = await params;

    let warranty
    try {
        warranty = await getWarrantyById(id)
    } catch (error) {
        notFound()
    }

    const getStatusBadge = (expiryDate: Date | null) => {
        if (!expiryDate) return <Badge variant="secondary">No Expiry</Badge>

        const now = new Date()
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
            return <Badge variant="destructive">Expired</Badge>
        } else if (daysUntilExpiry <= 30) {
            return <Badge className="bg-orange-500">Expiring Soon ({daysUntilExpiry} days)</Badge>
        } else {
            return <Badge className="bg-green-500">Active ({daysUntilExpiry} days left)</Badge>
        }
    }

    const getDocumentIcon = (type: string) => {
        switch (type) {
            case 'RECEIPT':
                return <Receipt className="h-5 w-5" />
            case 'WARRANTY_CARD':
                return <FileText className="h-5 w-5" />
            case 'PRODUCT_PHOTO':
                return <ImageIcon className="h-5 w-5" />
            default:
                return <FileText className="h-5 w-5" />
        }
    }

    const getDocumentLabel = (type: string) => {
        switch (type) {
            case 'RECEIPT':
                return 'Receipt/Invoice'
            case 'WARRANTY_CARD':
                return 'Warranty Card'
            case 'PRODUCT_PHOTO':
                return 'Product Photo'
            default:
                return 'Document'
        }
    }

    const warrantyCards = warranty.documents.filter(d => d.type === 'WARRANTY_CARD')
    const receipts = warranty.documents.filter(d => d.type === 'RECEIPT')
    const photos = warranty.documents.filter(d => d.type === 'PRODUCT_PHOTO')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/warranties">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{warranty.title}</h2>
                        <p className="text-muted-foreground">
                            {warranty.brand && `${warranty.brand} `}
                            {warranty.model && `- ${warranty.model}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/warranties/${warranty.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                    <DeleteWarrantyButton warrantyId={warranty.id} warrantyTitle={warranty.title} />
                </div>
            </div>

            {/* Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Warranty Status</CardTitle>
                        {getStatusBadge(warranty.expiryDate)}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {warranty.purchaseDate && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Purchase Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">{new Date(warranty.purchaseDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                        {warranty.expiryDate && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Expiry Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">{new Date(warranty.expiryDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                        {warranty.warrantyPeriod && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Warranty Period</p>
                                <p className="font-medium">{warranty.warrantyPeriod} months</p>
                            </div>
                        )}
                        {warranty.price && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Price</p>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">{warranty.price.toString()} {warranty.currency}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {warranty.category && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Category</p>
                                <p className="font-medium">{warranty.category}</p>
                            </div>
                        )}
                        {warranty.brand && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Brand</p>
                                <p className="font-medium">{warranty.brand}</p>
                            </div>
                        )}
                        {warranty.model && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Model</p>
                                <p className="font-medium">{warranty.model}</p>
                            </div>
                        )}
                        {warranty.merchantName && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Merchant</p>
                                <p className="font-medium">{warranty.merchantName}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Account</p>
                            <p className="font-medium">{warranty.account.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Created By</p>
                            <p className="font-medium">{warranty.createdBy.name || warranty.createdBy.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documents */}
            <Card>
                <CardHeader>
                    <CardTitle>Documents ({warranty.documents.length})</CardTitle>
                    <CardDescription>All attached documents for this warranty</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Warranty Cards */}
                    {warrantyCards.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Warranty Cards ({warrantyCards.length})</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {warrantyCards.map((doc) => (
                                    <a
                                        key={doc.id}
                                        href={getFileUrl(doc.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted hover:bg-muted/80 transition-colors">
                                            <img
                                                src={getFileUrl(doc.url)}
                                                alt="Warranty Card"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Receipts */}
                    {receipts.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Receipts/Invoices ({receipts.length})</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {receipts.map((doc) => (
                                    <a
                                        key={doc.id}
                                        href={getFileUrl(doc.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted hover:bg-muted/80 transition-colors">
                                            <img
                                                src={getFileUrl(doc.url)}
                                                alt="Receipt"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Product Photos */}
                    {photos.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Product Photos ({photos.length})</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {photos.map((doc) => (
                                    <a
                                        key={doc.id}
                                        href={getFileUrl(doc.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted hover:bg-muted/80 transition-colors">
                                            <img
                                                src={getFileUrl(doc.url)}
                                                alt="Product Photo"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {warranty.documents.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No documents attached</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
