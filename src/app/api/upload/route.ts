import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        const uploadedFiles = [] as Array<{
            filename: string | undefined;
            originalName: string;
            path: string;
            size: number;
            type: string;
        }>;

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Unique key for MinIO
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const extension = file.name.split('.').pop();
            const key = `uploads/${timestamp}-${randomString}.${extension}`;

            // Upload to MinIO and obtain public URL
            const url = await uploadFile(key, buffer, file.type);

            uploadedFiles.push({
                filename: key.split('/').pop(),
                originalName: file.name,
                path: url,
                size: file.size,
                type: file.type,
            });
        }

        return NextResponse.json({ files: uploadedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}