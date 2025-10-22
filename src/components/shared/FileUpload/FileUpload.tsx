'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
