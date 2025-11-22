'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { uploadFile, deleteFile } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

const WarrantySchema = z.object({
    title: z.string().min(1, 'Title is required'),
    category: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    purchaseDate: z.string().optional(),
    warrantyPeriod: z.number().min(1, 'Warranty period must be at least 1 month'),
    price: z.number().optional(),
    currency: z.string().default('BGN'),
    merchantName: z.string().optional(),
    documents: z.array(z.object({
        type: z.enum(['RECEIPT', 'WARRANTY_CARD', 'PRODUCT_PHOTO']),
        url: z.string()
    }))
})

export async function createWarranty(data: z.infer<typeof WarrantySchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        const validated = WarrantySchema.parse(data)

        // Get user's default account (first account they're admin of)
        const userAccount = await prisma.accountUser.findFirst({
            where: {
                userId: session.user.id,
                role: { in: ['GLOBAL_ADMIN', 'ACCOUNT_ADMIN', 'USER'] }
            }
        })

        if (!userAccount) {
            throw new Error('No account found for user')
        }

        // Calculate expiry date
        let expiryDate = null
        if (validated.purchaseDate && validated.warrantyPeriod) {
            const purchase = new Date(validated.purchaseDate)
            expiryDate = new Date(purchase)
            expiryDate.setMonth(expiryDate.getMonth() + validated.warrantyPeriod)
        }

        const warranty = await prisma.warrantyItem.create({
            data: {
                accountId: userAccount.accountId,
                createdByUserId: session.user.id,
                title: validated.title,
                category: validated.category,
                brand: validated.brand,
                model: validated.model,
                purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
                warrantyPeriod: validated.warrantyPeriod,
                expiryDate,
                price: validated.price,
                currency: validated.currency,
                merchantName: validated.merchantName,
                documents: {
                    create: validated.documents.map(doc => ({
                        type: doc.type,
                        url: doc.url
                    }))
                }
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/warranties')

        return { success: true, warrantyId: warranty.id }
    } catch (error) {
        console.error('Create warranty error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Failed to create warranty' }
    }
}

export async function getWarranties() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true }
        })

        const accountIds = userAccounts.map(ua => ua.accountId)

        const warranties = await prisma.warrantyItem.findMany({
            where: {
                accountId: { in: accountIds }
            },
            include: {
                documents: true,
                createdBy: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return warranties.map(warranty => ({
            ...warranty,
            price: warranty.price ? Number(warranty.price) : null
        }))
    } catch (error) {
        console.error('Get warranties error:', error)
        throw new Error('Failed to fetch warranties')
    }
}

export async function getWarrantyById(id: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        // Get user's account IDs
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true }
        })

        const accountIds = userAccounts.map(ua => ua.accountId)

        // Fetch warranty and check if user has access
        const warranty = await prisma.warrantyItem.findFirst({
            where: {
                id,
                accountId: { in: accountIds }
            },
            include: {
                documents: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                createdBy: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                account: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if (!warranty) {
            throw new Error('Warranty not found or access denied')
        }

        return {
            ...warranty,
            price: warranty.price ? Number(warranty.price) : null
        }
    } catch (error) {
        console.error('Get warranty by ID error:', error)
        throw new Error('Failed to fetch warranty')
    }
}

export async function deleteWarranty(id: string) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true },
        });

        const accountIds = userAccounts.map(ua => ua.accountId);

        const warranty = await prisma.warrantyItem.findFirst({
            where: { id, accountId: { in: accountIds } },
            include: { documents: true },
        });

        if (!warranty) {
            throw new Error('Warranty not found or access denied');
        }

        // Delete each document from MinIO
        for (const doc of warranty.documents) {
            try {
                const key = doc.url.split('/').slice(-2).join('/');
                await deleteFile(key);
            } catch (err) {
                console.error(`Failed to delete file ${doc.url} from MinIO:`, err);
            }
        }

        // Delete warranty (cascade removes DB rows)
        await prisma.warrantyItem.delete({ where: { id } });

        revalidatePath('/warranties');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Delete warranty error:', error);
        return { success: false, error: 'Failed to delete warranty' };
    }
}

const UpdateWarrantySchema = WarrantySchema.omit({ documents: true }).partial().extend({
    id: z.string()
})

export async function updateWarranty(data: z.infer<typeof UpdateWarrantySchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        const validated = UpdateWarrantySchema.parse(data)
        const { id, ...updateData } = validated

        // Get user's account IDs
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true }
        })

        const accountIds = userAccounts.map(ua => ua.accountId)

        // Check if user has access to this warranty
        const existing = await prisma.warrantyItem.findFirst({
            where: {
                id,
                accountId: { in: accountIds }
            }
        })

        if (!existing) {
            throw new Error('Warranty not found or access denied')
        }

        // Calculate expiry date if purchase date or warranty period changed
        let expiryDate = existing.expiryDate
        const purchaseDate = updateData.purchaseDate ? new Date(updateData.purchaseDate) : existing.purchaseDate
        const warrantyPeriod = updateData.warrantyPeriod ?? existing.warrantyPeriod

        if (purchaseDate && warrantyPeriod) {
            expiryDate = new Date(purchaseDate)
            expiryDate.setMonth(expiryDate.getMonth() + warrantyPeriod)
        }

        const warranty = await prisma.warrantyItem.update({
            where: { id },
            data: {
                title: updateData.title,
                category: updateData.category,
                brand: updateData.brand,
                model: updateData.model,
                purchaseDate: updateData.purchaseDate ? new Date(updateData.purchaseDate) : undefined,
                warrantyPeriod: updateData.warrantyPeriod,
                expiryDate,
                price: updateData.price,
                currency: updateData.currency,
                merchantName: updateData.merchantName
            }
        })

        revalidatePath('/warranties')
        revalidatePath(`/warranties/${id}`)
        revalidatePath('/dashboard')

        return { success: true, warrantyId: warranty.id }
    } catch (error) {
        console.error('Update warranty error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Failed to update warranty' }
    }
}

export async function deleteDocument(documentId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true },
        });

        const accountIds = userAccounts.map(ua => ua.accountId);

        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                warrantyItem: { accountId: { in: accountIds } },
            },
        });

        if (!document) {
            throw new Error('Document not found or access denied');
        }

        // Delete file from MinIO
        const key = document.url.split('/').slice(-2).join('/');
        await deleteFile(key);

        // Delete DB row
        await prisma.document.delete({ where: { id: documentId } });

        revalidatePath('/warranties');
        revalidatePath(`/warranties/${document.warrantyItemId}`);
        return { success: true };
    } catch (error) {
        console.error('Delete document error:', error);
        return { success: false, error: 'Failed to delete document' };
    }
}

export async function addDocuments(warrantyId: string, documents: Array<{ type: DocumentType; url: string }>) {
    console.log('Documents received by addDocuments:', documents);
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        // Get user's account IDs
        const userAccounts = await prisma.accountUser.findMany({
            where: { userId: session.user.id },
            select: { accountId: true }
        })

        const accountIds = userAccounts.map(ua => ua.accountId)

        // Check if user has access to this warranty
        const warranty = await prisma.warrantyItem.findFirst({
            where: {
                id: warrantyId,
                accountId: { in: accountIds }
            }
        })

        if (!warranty) {
            throw new Error('Warranty not found or access denied')
        }

        // Add documents
        await prisma.document.createMany({
            data: documents.map(doc => ({
                warrantyItemId: warrantyId,
                type: doc.type,
                url: doc.url
            }))
        })

        revalidatePath('/warranties')
        revalidatePath(`/warranties/${warrantyId}`)

        return { success: true }
    } catch (error) {
        console.error('Add documents error:', error)
        return { success: false, error: 'Failed to add documents' }
    }
}

type DocumentType = 'RECEIPT' | 'WARRANTY_CARD' | 'PRODUCT_PHOTO'
