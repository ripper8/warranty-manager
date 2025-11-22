import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // MinIO‑compatible
});

/** Upload a buffer and return the public URL */
export async function uploadFile(
    key: string,
    buffer: Buffer,
    mime: string
): Promise<string> {
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mime,
        })
    );
    // Build public URL (works for MinIO and real S3)
    return `${process.env.S3_ENDPOINT?.replace(/\/+$/, '')}/${process.env.S3_BUCKET}/${key}`;
}

/** Delete a file from the bucket */
export async function deleteFile(key: string): Promise<void> {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
        })
    );
}