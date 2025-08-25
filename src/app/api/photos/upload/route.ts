import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadPhoto } from '@/lib/storage';
import { withCSRFProtection } from '@/lib/csrf';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limit';
import { RequestLimits, requestLimits } from '@/lib/request-limits';
import { FILE_UPLOAD, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import {
  fileValidation,
  validationResponses,
  validateWithSchema,
  commonSchemas,
} from '@/lib/validation-utils';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Validates the uploaded file for security and size constraints
 */
async function validateUploadedFile(file: File): Promise<NextResponse | null> {
  // Validate file type
  if (!fileValidation.isValidFileType(file.type)) {
    return validationResponses.validationError(
      'Invalid file type. Only images are allowed.'
    );
  }

  // Validate file size
  if (!fileValidation.isValidFileSize(file.size)) {
    return validationResponses.validationError(
      `File too large. Maximum size is ${FILE_UPLOAD.MAX_SIZE_MB}MB`
    );
  }

  // Validate filename for security
  if (!fileValidation.isValidFilename(file.name)) {
    return validationResponses.validationError('Invalid file name');
  }

  return null; // No validation errors
}

/**
 * Verifies user has access to the specified workspace
 */
async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<NextResponse | null> {
  // Check if user exists and get their role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // SUPER_ADMIN has access to all workspaces
  if (user?.role === 'SUPER_ADMIN') {
    return null;
  }

  const workspaceWithUser = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      users: { some: { id: userId } },
    },
  });

  if (!workspaceWithUser) {
    return validationResponses.forbidden(
      ERROR_MESSAGES.WORKSPACE_ACCESS_DENIED
    );
  }

  return null; // Access granted
}

/**
 * Processes the file upload and saves metadata to database
 */
async function processFileUpload(
  file: File,
  workspaceId: string,
  userId: string
) {
  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Google Cloud Storage
  const uploadResult = await uploadPhoto(buffer, file.name, file.type);

  // Save photo metadata to database
  const photo = await prisma.photo.create({
    data: {
      originalName: file.name,
      filename: uploadResult.filename,
      url: uploadResult.publicUrl,
      mimeType: file.type,
      size: uploadResult.size,
      uploadedById: userId,
      workspaceId: workspaceId,
    },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      selections: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  return photo;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      request,
      rateLimiters.upload
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply request size limits
    const validation = await RequestLimits.validateRequest(
      request,
      requestLimits.upload
    );
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          code: validation.code,
        },
        { status: validation.code === 'BODY_TOO_LARGE' ? 413 : 400 }
      );
    }

    // Apply CSRF protection
    return withCSRFProtection(request, async () => {
      // Authentication check
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return validationResponses.unauthorized();
      }

      // Parse form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const workspaceId = formData.get('workspaceId') as string;

      if (!file || !workspaceId) {
        return validationResponses.validationError(
          'File and workspaceId are required'
        );
      }

      // Validate workspace ID format
      const schemaValidation = validateWithSchema(commonSchemas.fileUpload, {
        workspaceId,
      });
      if (!schemaValidation.success) {
        return validationResponses.validationError(
          ERROR_MESSAGES.INVALID_INPUT,
          schemaValidation.errors
        );
      }

      // Verify workspace access
      const accessError = await verifyWorkspaceAccess(
        workspaceId,
        session.user.id
      );
      if (accessError) return accessError;

      // Validate uploaded file
      const fileError = await validateUploadedFile(file);
      if (fileError) return fileError;

      // Process file upload
      const photo = await processFileUpload(file, workspaceId, session.user.id);

      return NextResponse.json({
        photo,
        message: SUCCESS_MESSAGES.PHOTO_UPLOADED,
      });
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return validationResponses.serverError('Failed to upload photo');
  }
}
