'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateWarranty, addDocuments, deleteDocument } from '@/lib/warranty-actions'
import { Upload, X, FileText, Receipt, Camera, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type DocumentType = 'RECEIPT' | 'WARRANTY_CARD' | 'PRODUCT_PHOTO'

interface UploadedFile {
    filename: string
    originalName: string
    key: string
    size: number
    type: string
    documentType: DocumentType
}

interface ExistingDocument {
    id: string
    type: string
    url: string
    createdAt: Date
}

interface EditWarrantyFormProps {
    warranty: {
        id: string
        title: string
        category: string | null
        brand: string | null
        model: string | null
        purchaseDate: Date | null
        warrantyPeriod: number | null
        price: any | null
        currency: string
        merchantName: string | null
        documents: ExistingDocument[]
    }
}

export default function EditWarrantyForm({ warranty }: EditWarrantyFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [existingDocs, setExistingDocs] = useState<ExistingDocument[]>(warranty.documents)

    const [formData, setFormData] = useState({
        title: warranty.title,
        category: warranty.category || '',
        brand: warranty.brand || '',
        model: warranty.model || '',
        purchaseDate: warranty.purchaseDate ? new Date(warranty.purchaseDate).toISOString().split('T')[0] : '',
        warrantyPeriod: warranty.warrantyPeriod?.toString() || '12',
        price: warranty.price?.toString() || '',
        currency: warranty.currency,
        merchantName: warranty.merchantName || ''
    })

    const handleFileUpload = async (files: FileList | null, docType: DocumentType) => {
        if (!files || files.length === 0) return

        setUploading(true)
        setError('')

        try {
            const formData = new FormData()
            Array.from(files).forEach(file => {
                formData.append('files', file)
            })

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const data = await response.json()
            const newFiles = data.files.map((file: any) => ({
                ...file,
                documentType: docType
            }))

            setUploadedFiles(prev => [...prev, ...newFiles])
        } catch (err) {
            setError('Failed to upload files')
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    const removeNewFile = (filename: string) => {
        setUploadedFiles(prev => prev.filter(f => f.filename !== filename))
    }

    const removeExistingDoc = async (docId: string) => {
        startTransition(async () => {
            const result = await deleteDocument(docId)
            if (result.success) {
                setExistingDocs(prev => prev.filter(d => d.id !== docId))
            } else {
                setError(result.error || 'Failed to delete document')
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        startTransition(async () => {
            // Update warranty data
            const updateResult = await updateWarranty({
                id: warranty.id,
                title: formData.title,
                category: formData.category || undefined,
                brand: formData.brand || undefined,
                model: formData.model || undefined,
                purchaseDate: formData.purchaseDate || undefined,
                warrantyPeriod: parseInt(formData.warrantyPeriod),
                price: formData.price ? parseFloat(formData.price) : undefined,
                currency: formData.currency,
                merchantName: formData.merchantName || undefined
            })

            if (!updateResult.success) {
                setError(updateResult.error || 'Failed to update warranty')
                return
            }

            // Add new documents if any
            if (uploadedFiles.length > 0) {
                const addDocsResult = await addDocuments(
                    warranty.id,
                    uploadedFiles.map(f => ({
                        type: f.documentType,
                        url: f.key
                    }))
                )

                if (!addDocsResult.success) {
                    setError(addDocsResult.error || 'Failed to add documents')
                    return
                }
            }

            router.push(`/warranties/${warranty.id}`)
            router.refresh()
        })
    }

    const categories = [
        'Electronics',
        'Appliances',
        'Furniture',
        'Tools',
        'Automotive',
        'Other'
    ]

    const getDocumentLabel = (type: string) => {
        switch (type) {
            case 'RECEIPT':
                return 'Receipt'
            case 'WARRANTY_CARD':
                return 'Warranty Card'
            case 'PRODUCT_PHOTO':
                return 'Photo'
            default:
                return 'Document'
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/warranties/${warranty.id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Warranty</h2>
                    <p className="text-muted-foreground">Update warranty details and documents</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Existing Documents */}
                {existingDocs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Documents</CardTitle>
                            <CardDescription>Existing documents attached to this warranty</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                {existingDocs.map((doc) => (
                                    <div key={doc.id} className="relative group">
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                                                <img
                                                    src={doc.url}
                                                    alt={getDocumentLabel(doc.type)}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        </a>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">{getDocumentLabel(doc.type)}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeExistingDoc(doc.id)}
                                                disabled={isPending}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* File Uploads */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Documents</CardTitle>
                        <CardDescription>Upload additional warranty cards, receipts, or photos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Warranty Card Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="warranty-card">Warranty Card</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="warranty-card"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    multiple
                                    onChange={(e) => handleFileUpload(e.target.files, 'WARRANTY_CARD')}
                                    disabled={uploading || isPending}
                                />
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Receipt Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="receipt">Receipt / Invoice</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="receipt"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    multiple
                                    onChange={(e) => handleFileUpload(e.target.files, 'RECEIPT')}
                                    disabled={uploading || isPending}
                                />
                                <Receipt className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Product Photo Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="product-photo">Product Photo</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="product-photo"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleFileUpload(e.target.files, 'PRODUCT_PHOTO')}
                                    disabled={uploading || isPending}
                                />
                                <Camera className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* New Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>New Files to Add</Label>
                                <div className="space-y-2">
                                    {uploadedFiles.map((file) => (
                                        <div key={file.filename} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                <Upload className="h-4 w-4" />
                                                <span className="text-sm">{file.originalName}</span>
                                                <span className="text-xs text-muted-foreground">({file.documentType})</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeNewFile(file.filename)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Product Name *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    disabled={isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Warranty Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Warranty Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="purchaseDate">Purchase Date</Label>
                                <Input
                                    id="purchaseDate"
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="warrantyPeriod">Warranty Period (months) *</Label>
                                <Input
                                    id="warrantyPeriod"
                                    type="number"
                                    min="1"
                                    value={formData.warrantyPeriod}
                                    onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="merchantName">Merchant</Label>
                                <Input
                                    id="merchantName"
                                    value={formData.merchantName}
                                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex gap-4">
                    <Button type="submit" disabled={isPending || uploading}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                    <Link href={`/warranties/${warranty.id}`}>
                        <Button type="button" variant="outline" disabled={isPending}>
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    )
}
