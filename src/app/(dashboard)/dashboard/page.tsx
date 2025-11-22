import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats } from "@/lib/dashboard-actions"
import Link from "next/link"
import { FileText, AlertCircle, CheckCircle, XCircle, Calendar } from "lucide-react"

export default async function DashboardPage() {
    const stats = await getDashboardStats()

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

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All warranties in your accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">More than 30 days left</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                        <p className="text-xs text-muted-foreground">Next 30 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expired</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expired}</div>
                        <p className="text-xs text-muted-foreground">Past expiry date</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Warranties */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Warranties</CardTitle>
                    <CardDescription>Your most recently added warranties</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentWarranties.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No warranties yet</p>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentWarranties.map((warranty) => (
                                <Link
                                    key={warranty.id}
                                    href={`/warranties/${warranty.id}`}
                                    className="block"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                                        <div className="space-y-1">
                                            <p className="font-medium">{warranty.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                {warranty.brand && <span>{warranty.brand}</span>}
                                                {warranty.category && (
                                                    <>
                                                        <span className="hidden xs:inline">•</span>
                                                        <span>{warranty.category}</span>
                                                    </>
                                                )}
                                                <span className="hidden xs:inline">•</span>
                                                <span>{warranty.documentsCount} doc(s)</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                                            <div className="text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(warranty.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {getStatusBadge(warranty.expiryDate)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            {
                Object.keys(stats.categoryBreakdown).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>By Category</CardTitle>
                            <CardDescription>Warranties grouped by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(stats.categoryBreakdown)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, count]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{category}</span>
                                            <Badge variant="outline">{count}</Badge>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    )
}
