'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // MB
  accept?: Record<string, string[]>;
  multiple?: boolean;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 5,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf']
  },
  multiple = false,
}: FileUploadProps) {
  const t = useTranslations('common');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
    rejectedFiles.forEach((rejection) => {
      const file = rejection.file;
      const errors = rejection.errors;

      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          toast.error(t('fileUpload.fileTooLarge', {
            filename: file.name,
            size: fileSizeMB,
            maxSize
          }));
        } else if (error.code === 'file-invalid-type') {
          toast.error(t('fileUpload.invalidFileType', { filename: file.name }));
        } else {
          toast.error(t('fileUpload.uploadError', {
            filename: file.name,
            error: error.message
          }));
        }
      });
    });
  }, [maxSize, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple,
    maxSize: maxSize * 1024 * 1024,
    accept,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">
        {isDragActive ? t('dropHere') : t('dragOrClick')}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {t('maxSize', { size: maxSize })}
      </p>
    </div>
  );
}
