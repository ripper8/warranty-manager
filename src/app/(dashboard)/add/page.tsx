'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWarranty } from '@/lib/warranty-actions'
import { Upload, X, FileText, Receipt, Camera } from 'lucide-react'

type DocumentType = 'RECEIPT' | 'WARRANTY_CARD' | 'PRODUCT_PHOTO'

interface UploadedFile {
    filename: string
    originalName: string
    key: string
    size: number
    type: string
    documentType: DocumentType
}

export default function AddWarrantyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        brand: '',
        model: '',
        purchaseDate: '',
        warrantyPeriod: '12',
        price: '',
        currency: 'BGN',
        merchantName: ''
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

    const removeFile = (filename: string) => {
        setUploadedFiles(prev => prev.filter(f => f.filename !== filename))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await createWarranty({
                title: formData.title,
                category: formData.category || undefined,
                brand: formData.brand || undefined,
                model: formData.model || undefined,
                purchaseDate: formData.purchaseDate || undefined,
                warrantyPeriod: parseInt(formData.warrantyPeriod),
                price: formData.price ? parseFloat(formData.price) : undefined,
                currency: formData.currency,
                merchantName: formData.merchantName || undefined,
                documents: uploadedFiles.map(f => ({
                    type: f.documentType,
                    url: f.key
                }))
            })

            if (result.success) {
                router.push('/warranties')
            } else {
                setError(result.error || 'Failed to create warranty')
            }
        } catch (err) {
            setError('An error occurred')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const categories = [
        'Electronics',
        'Appliances',
        'Furniture',
        'Tools',
        'Automotive',
        'Other'
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Add New Warranty</h2>
                <p className="text-muted-foreground">Upload documents and fill in the details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Uploads */}
                <Card>
                    <CardHeader>
                        <CardTitle>Documents</CardTitle>
                        <CardDescription>Upload warranty cards, receipts, and product photos</CardDescription>
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
                                    disabled={uploading}
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
                                    disabled={uploading}
                                />
                                <Receipt className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Product Photo Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="product-photo">Product Photo (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="product-photo"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleFileUpload(e.target.files, 'PRODUCT_PHOTO')}
                                    disabled={uploading}
                                />
                                <Camera className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>Uploaded Files</Label>
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
                                                onClick={() => removeFile(file.filename)}
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
                                    placeholder="e.g., Samsung TV 55 inch"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                                    placeholder="e.g., Samsung"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    placeholder="e.g., UE55AU7172"
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
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="merchantName">Merchant</Label>
                                <Input
                                    id="merchantName"
                                    value={formData.merchantName}
                                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                    placeholder="e.g., Technopolis"
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
                    <Button type="submit" disabled={loading || uploading} className="flex-1">
                        {loading ? 'Creating...' : 'Create Warranty'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
