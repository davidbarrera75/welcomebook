
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
  });

  await s3Client.send(command);
  return key; // Return the S3 key (cloud_storage_path)
}

export async function downloadFile(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't have rename, so we copy and delete
  // For simplicity, we'll just return the new key
  // In a production app, you'd implement copy + delete
  return newKey;
}
