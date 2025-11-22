import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const filename = params.filename
        const filepath = join(process.cwd(), 'uploads', filename)
        const fileBuffer = await readFile(filepath)

        // Determine content type based on extension
        const ext = filename.split('.').pop()?.toLowerCase()
        const contentTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'webp': 'image/webp'
        }

        const contentType = contentTypes[ext || ''] || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })
    } catch (error) {
        console.error('File read error:', error)
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
}
