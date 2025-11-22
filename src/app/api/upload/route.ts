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

            // Generate a unique key for MinIO
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const extension = file.name.split('.').pop();
            const key = `uploads/${timestamp}-${randomString}.${extension}`;

            // Upload to MinIO and get the key
            const fileKey = await uploadFile(key, buffer, file.type);
            console.log('fileKey from uploadFile:', fileKey);

            uploadedFiles.push({
                filename: fileKey.split('/').pop(),
                originalName: file.name,
                key: fileKey, // Return the key instead of the full path
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