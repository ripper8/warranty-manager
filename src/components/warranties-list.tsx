'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { PlusCircle, Calendar, Euro, Search, Building2 } from 'lucide-react'
import { useAccount } from '@/components/account-context'

interface Warranty {
    id: string
    title: string
    category: string | null
    brand: string | null
    model: string | null
    purchaseDate: Date | null
    expiryDate: Date | null
    price: any | null
    currency: string
    merchantName: string | null
    documents: any[]
    account: {
        id: string
        name: string
    }
}

interface WarrantiesListProps {
    warranties: Warranty[]
}

export default function WarrantiesList({ warranties }: WarrantiesListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const { selectedAccountId } = useAccount()

    const getStatus = (expiryDate: Date | null): 'active' | 'expiring' | 'expired' | 'no-expiry' => {
        if (!expiryDate) return 'no-expiry'

        const now = new Date()
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) return 'expired'
        if (daysUntilExpiry <= 30) return 'expiring'
        return 'active'
    }

    const getStatusBadge = (expiryDate: Date | null) => {
        if (!expiryDate) return <Badge variant="secondary">No Expiry</Badge>

        const now = new Date()
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
            return <Badge variant="destructive">Expired</Badge>
        } else if (daysUntilExpiry <= 30) {
            return <Badge className="bg-orange-500">Expiring Soon</Badge>
        } else {
            return <Badge className="bg-green-500">Active</Badge>
        }
    }

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(warranties.map(w => w.category).filter(Boolean))
        return Array.from(cats).sort()
    }, [warranties])

    // Filter warranties
    const filteredWarranties = useMemo(() => {
        return warranties.filter(warranty => {
            // Search filter
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch = searchQuery === '' ||
                warranty.title.toLowerCase().includes(searchLower) ||
                warranty.brand?.toLowerCase().includes(searchLower) ||
                warranty.model?.toLowerCase().includes(searchLower) ||
                warranty.merchantName?.toLowerCase().includes(searchLower) ||
                warranty.category?.toLowerCase().includes(searchLower)

            // Status filter
            const status = getStatus(warranty.expiryDate)
            const matchesStatus = statusFilter === 'all' || status === statusFilter

            // Category filter
            const matchesCategory = categoryFilter === 'all' || warranty.category === categoryFilter

            // Account filter
            const matchesAccount = selectedAccountId === 'all' || warranty.account.id === selectedAccountId

            return matchesSearch && matchesStatus && matchesCategory && matchesAccount
        })
    }, [warranties, searchQuery, statusFilter, categoryFilter, selectedAccountId])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Warranties</h2>
                    <p className="text-muted-foreground">Manage all your warranty cards</p>
                </div>
                <Link href="/add" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Warranty
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            {warranties.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search warranties..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="no-expiry">No Expiry</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Category Filter */}
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Results count */}
                        <div className="mt-4 text-sm text-muted-foreground">
                            Showing {filteredWarranties.length} of {warranties.length} warranties
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warranties Grid */}
            {warranties.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">No warranties yet</p>
                        <Link href="/add">
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Your First Warranty
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : filteredWarranties.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">No warranties match your filters</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery('')
                                setStatusFilter('all')
                                setCategoryFilter('all')
                            }}
                        >
                            Clear Filters
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredWarranties.map((warranty) => (
                        <Link key={warranty.id} href={`/warranties/${warranty.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{warranty.title}</CardTitle>
                                            <CardDescription>
                                                {warranty.brand && `${warranty.brand} `}
                                                {warranty.model && `- ${warranty.model}`}
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(warranty.expiryDate)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {warranty.category && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Category:</span> {warranty.category}
                                        </div>
                                    )}
                                    {warranty.purchaseDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Purchased: {format(new Date(warranty.purchaseDate), 'dd/MM/yyyy')}</span>
                                        </div>
                                    )}
                                    {warranty.expiryDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Expires: {format(new Date(warranty.expiryDate), 'dd/MM/yyyy')}</span>
                                        </div>
                                    )}
                                    {warranty.price && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Euro className="h-4 w-4 text-muted-foreground" />
                                            <span>{warranty.price.toString()} {warranty.currency}</span>
                                        </div>
                                    )}
                                    {warranty.merchantName && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Merchant:</span> {warranty.merchantName}
                                        </div>
                                    )}
                                    <div className="pt-2 flex items-center gap-2">
                                        <Badge variant="outline">{warranty.documents.length} document(s)</Badge>
                                        {selectedAccountId === 'all' && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                {warranty.account.name}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
