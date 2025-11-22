import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET || '';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string }> }
) {
    const { filename } = await context.params;

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `uploads/${filename}`,
        });

        const { Body, ContentType } = await s3.send(command);

        if (!Body) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // In a Node.js environment, Body is a Readable stream
        const readableStream = Body as Readable;

        // For Next.js Edge/Vercel, you might need to adapt this
        // For Node.js runtime:
        const response = new NextResponse(readableStream as any, {
            headers: {
                'Content-Type': ContentType || 'application/octet-stream',
            },
        });

        return response;

    } catch (error: any) {
        if (error.name === 'NoSuchKey') {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        console.error('Error fetching file from S3:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}