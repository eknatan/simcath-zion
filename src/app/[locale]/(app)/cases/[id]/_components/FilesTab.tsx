'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileUpload } from '@/components/shared/FileUpload';
import { ActionButton } from '@/components/shared/ActionButton';
import {
  FileText,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  File,
  Paperclip,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CaseWithRelations,
  CaseFile,
  WeddingFileType,
  REQUIRED_WEDDING_FILES,
} from '@/types/case.types';
import { useCaseFiles } from '@/components/features/cases/hooks/useCaseFiles';

interface FilesTabProps {
  caseData: CaseWithRelations;
}

/**
 * File type configuration
 */
interface FileTypeConfig {
  type: WeddingFileType;
  label: string;
  icon: typeof FileText;
  required: boolean;
  description?: string;
}

const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  {
    type: WeddingFileType.MENU,
    label: 'תפריט החתונה',
    icon: FileText,
    required: true,
    description: 'PDF או תמונה של תפריט החתונה',
  },
  {
    type: WeddingFileType.INVITATION,
    label: 'הזמנת החתונה',
    icon: FileText,
    required: true,
    description: 'PDF או תמונה של ההזמנה',
  },
  {
    type: WeddingFileType.COUPLE_PHOTO,
    label: 'תמונת החתן והכלה',
    icon: ImageIcon,
    required: true,
    description: 'תמונה משותפת של החתן והכלה',
  },
  {
    type: WeddingFileType.THANK_YOU,
    label: 'מכתב תודה',
    icon: FileText,
    required: false,
    description: 'מכתב תודה (אופציונלי)',
  },
  {
    type: WeddingFileType.OTHER,
    label: 'קבצים נוספים',
    icon: File,
    required: false,
    description: 'קבצים נוספים (אופציונלי)',
  },
];

/**
 * FilesTab - Manage case files
 *
 * Features:
 * - Drag & drop file upload
 * - Required/optional files tracking
 * - PDF and image preview
 * - Delete with confirmation
 * - Upload progress indicator
 *
 * Version B design: Elegant & Soft
 */
export function FilesTab({ caseData }: FilesTabProps) {
  const t = useTranslations('case.files');
  const tCommon = useTranslations('common');

  // ========================================
  // State & Hooks
  // ========================================

  const [deleteDialogFile, setDeleteDialogFile] = useState<CaseFile | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  // Use the custom hook for file management
  const {
    files: fetchedFiles,
    isLoading,
    uploadFile,
    deleteFile,
    uploadProgress,
  } = useCaseFiles(caseData.id);

  // Use fetched files if available, otherwise fall back to initial data
  const files = fetchedFiles || caseData.files || [];

  // ========================================
  // Signed URL Fetching
  // ========================================

  /**
   * Fetch signed URL for a file
   */
  const fetchSignedUrl = useCallback(async (fileId: string): Promise<string | null> => {
    // Return cached URL if available
    if (signedUrls[fileId]) {
      return signedUrls[fileId];
    }

    // Don't fetch if already loading
    if (loadingUrls.has(fileId)) {
      return null;
    }

    try {
      setLoadingUrls(prev => new Set(prev).add(fileId));

      const response = await fetch(`/api/files/${fileId}/url`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const data = await response.json();

      setSignedUrls(prev => ({
        ...prev,
        [fileId]: data.url
      }));

      return data.url;
    } catch (error) {
      console.error('Error fetching signed URL:', error);
      return null;
    } finally {
      setLoadingUrls(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, [signedUrls, loadingUrls]);

  /**
   * Fetch signed URLs for all files on mount/update
   */
  useEffect(() => {
    files.forEach(file => {
      if (!signedUrls[file.id] && !loadingUrls.has(file.id)) {
        fetchSignedUrl(file.id);
      }
    });
  }, [files, signedUrls, loadingUrls, fetchSignedUrl]);

  // ========================================
  // Helpers
  // ========================================

  /**
   * Get files for a specific type
   */
  const getFilesForType = (fileType: WeddingFileType): CaseFile[] => {
    return files.filter((f) => f.file_type === fileType);
  };

  /**
   * Check if file type has been uploaded
   */
  const hasFileForType = (fileType: WeddingFileType): boolean => {
    return getFilesForType(fileType).length > 0;
  };

  /**
   * Get file extension from filename
   */
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  /**
   * Check if file is an image
   */
  const isImageFile = (filename: string): boolean => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png'].includes(ext);
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ========================================
  // Upload Handler
  // ========================================

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(
    async (selectedFiles: File[], fileType: WeddingFileType) => {
      if (selectedFiles.length === 0) return;

      const file = selectedFiles[0]; // Take first file

      try {
        // Use the hook's uploadFile function which handles everything
        await uploadFile(file, fileType);
      } catch (error) {
        // Error already handled by the hook with toast
        console.error('Upload error:', error);
      }
    },
    [uploadFile]
  );

  // ========================================
  // Download Handler
  // ========================================

  /**
   * Handle file download - fetches signed URL and triggers browser download
   */
  const handleDownload = async (file: CaseFile) => {
    try {
      setDownloadingFileId(file.id);

      // Get signed URL (from cache or fetch new)
      const url = signedUrls[file.id] || await fetchSignedUrl(file.id);
      if (!url) {
        throw new Error('Failed to get download URL');
      }

      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // ========================================
  // Delete Handler
  // ========================================

  /**
   * Handle file deletion
   */
  const handleDeleteFile = async (file: CaseFile) => {
    try {
      // Use the hook's deleteFile function which handles everything
      await deleteFile(file.id);
      setDeleteDialogFile(null);
    } catch (error) {
      // Error already handled by the hook with toast
      console.error('Delete error:', error);
    }
  };

  // ========================================
  // Render Helpers
  // ========================================

  /**
   * Render file card for a specific type
   */
  const renderFileTypeCard = (config: FileTypeConfig) => {
    const filesForType = getFilesForType(config.type);
    const hasFile = filesForType.length > 0;
    const isUploadingThisType = Array.from(uploadProgress.keys()).some((key) =>
      key.startsWith(config.type)
    );

    const Icon = config.icon;

    return (
      <Card
        key={config.type}
        className={cn(
          'shadow-md border transition-all',
          hasFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200',
          isUploadingThisType && 'border-sky-200 bg-sky-50/30'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-base">{config.label}</CardTitle>
              {config.required && (
                <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                  חובה
                </Badge>
              )}
            </div>
            {hasFile && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {!hasFile && config.required && <AlertCircle className="h-5 w-5 text-amber-600" />}
          </div>
          {config.description && (
            <CardDescription className="text-xs">{config.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Upload progress */}
          {isUploadingThisType &&
            Array.from(uploadProgress.entries())
              .filter(([key]) => key.startsWith(config.type))
              .map(([key, progress]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                      <span className="text-slate-600">מעלה קובץ...</span>
                    </div>
                    <span className="text-slate-600 font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}

          {/* Uploaded files */}
          {filesForType.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white"
            >
              {/* File icon/thumbnail */}
              <div className="flex-shrink-0">
                {isImageFile(file.filename) && signedUrls[file.id] ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signedUrls[file.id]}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : isImageFile(file.filename) && loadingUrls.has(file.id) ? (
                  <div className="w-12 h-12 rounded flex items-center justify-center bg-slate-100">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded flex items-center justify-center bg-red-50 border border-red-200">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.filename}</p>
                <p className="text-xs text-slate-500">
                  {file.size_bytes && formatFileSize(file.size_bytes)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <ActionButton
                  variant="view"
                  size="sm"
                  onClick={async () => {
                    const url = signedUrls[file.id] || await fetchSignedUrl(file.id);
                    if (url) window.open(url, '_blank');
                  }}
                  disabled={loadingUrls.has(file.id)}
                  aria-label={tCommon('view')}
                >
                  {loadingUrls.has(file.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </ActionButton>

                <ActionButton
                  variant="view"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFileId === file.id}
                  aria-label={tCommon('download')}
                >
                  {downloadingFileId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </ActionButton>

                <ActionButton
                  variant="reject"
                  size="sm"
                  onClick={() => setDeleteDialogFile(file)}
                  aria-label={tCommon('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          ))}

          {/* Upload button */}
          {(!hasFile || config.type === WeddingFileType.OTHER) && !isUploadingThisType && (
            <FileUpload
              onFilesSelected={(files) => handleFileUpload(files, config.type)}
              maxSize={5}
              accept={{
                'application/pdf': ['.pdf'],
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
              }}
              multiple={false}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // ========================================
  // Calculate Stats
  // ========================================

  const totalRequired = REQUIRED_WEDDING_FILES.length;
  const uploadedRequired = REQUIRED_WEDDING_FILES.filter((type) => hasFileForType(type)).length;
  const completionPercentage = Math.round((uploadedRequired / totalRequired) * 100);

  // ========================================
  // Render
  // ========================================

  return (
    <div className="space-y-6">
      {/* Loading state */}
      {isLoading && !files.length && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      )}

      {/* Header with stats */}
      <Card className="shadow-md border border-slate-200 bg-gradient-to-br from-white to-sky-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-sky-600" />
                {t('title')}
              </CardTitle>
              <CardDescription className="mt-1">{t('description')}</CardDescription>
            </div>

            <div className="text-end">
              <div className="text-3xl font-bold text-sky-900">
                {uploadedRequired}/{totalRequired}
              </div>
              <p className="text-xs text-sky-600 mt-1">{completionPercentage}% הושלם</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* File type cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {FILE_TYPE_CONFIGS.map((config) => renderFileTypeCard(config))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialogFile} onOpenChange={() => setDeleteDialogFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description', { filename: deleteDialogFile?.filename || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <ActionButton variant="cancel">{tCommon('cancel')}</ActionButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <ActionButton
                variant="reject-primary"
                onClick={() => deleteDialogFile && handleDeleteFile(deleteDialogFile)}
              >
                {tCommon('delete')}
              </ActionButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
