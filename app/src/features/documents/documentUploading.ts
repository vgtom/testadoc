import { createDocument, createTemplate, updateDocument, updateTemplate } from "wasp/client/operations";
import axios from "axios";
import { MAX_FILE_SIZE_BYTES } from "./validation";

interface UploadProgress {
  file: File;
  setUploadProgressPercent: (percent: number) => void;
  makeTemplate: boolean
}

export async function uploadDocumentWithProgress({
  file,
  setUploadProgressPercent,
  makeTemplate,
}: UploadProgress) {
  const validation = validatePDFFile(file);
  if (validation) throw validation;

  const { s3UploadUrl, s3UploadFields, doc } = await createDocument({
    fileName: file.name,
    fileType: file.type,
  });

  const formData = getUploadFormData(file, s3UploadFields);

  await axios.post(s3UploadUrl, formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        setUploadProgressPercent(percent);
      }
    },
  });

  if (makeTemplate) {
    await createTemplate({ documentId: doc.id, name: file.name });
  }

  return { doc };
}

function getUploadFormData(file: File, fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", file);
  return formData;
}

export interface FileUploadError {
  message: string;
  code: "NO_FILE" | "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED";
}

function validatePDFFile(file: File): FileUploadError | null {
  if (!file) return { message: "No file provided.", code: "NO_FILE" };
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      message: `File exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
      code: "FILE_TOO_LARGE",
    };
  }
  if (file.type !== "application/pdf") {
    return {
      message: "Only PDF files are allowed.",
      code: "INVALID_FILE_TYPE",
    };
  }
  return null;
}

interface UpdateDocumentProgress {
  documentId: string;
  file: File;
  setUploadProgressPercent: (percent: number) => void;
}

export async function updateDocumentWithProgress({
  documentId,
  file,
  setUploadProgressPercent,
}: UpdateDocumentProgress) {
  // Validate file (reuse your existing validation)
  const validation = validatePDFFile(file);
  if (validation) throw validation;

  // Get signed URL for upload
  const { s3UploadUrl, s3UploadFields, doc } = await updateDocument({
    documentId,
    fileName: file.name,
    fileType: file.type,
  });

  // Create form data for S3 upload
  const formData = getUploadFormData(file, s3UploadFields);

  // Upload to S3 with progress tracking
  await axios.post(s3UploadUrl, formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        setUploadProgressPercent(percent);
      }
    },
  });

  return { doc };
}
