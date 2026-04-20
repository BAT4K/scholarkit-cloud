const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { requireAuth } = require('./shared/auth');
const { success, error, options } = require('./shared/response');

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'scholarkit-uploads-bucket';
const s3Client = new S3Client({ region: REGION });

exports.handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === 'OPTIONS') return options();

    try {
        const user = requireAuth(event);
        
        // Ensure RBAC for sellers/admins
        if (user.role !== 'seller' && user.role !== 'admin') {
            return error('Access denied. Only sellers can upload images.', 403);
        }

        if (method !== 'POST') {
            return error('Method not allowed', 405);
        }

        const body = JSON.parse(event.body || '{}');
        const { filename, fileType } = body;

        if (!filename || !fileType) {
            return error('Missing filename or fileType.', 400);
        }

        // Generate a unique S3 object key
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `products/${uniqueId}-${safeFilename}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: fileType
        });

        // Generate presigned URL (expires in 5 minutes)
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        // Construct the final public URL (assuming the bucket has public-read access)
        const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

        return success({
            uploadUrl,
            publicUrl
        });
    } catch (err) {
        console.error('Presign URL generation error:', err);
        if (err.statusCode) return error(err.message, err.statusCode);
        return error('Could not generate upload URL.', 500);
    }
};
