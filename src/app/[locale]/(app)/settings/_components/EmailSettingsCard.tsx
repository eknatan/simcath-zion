/**
 * EmailSettingsCard Component
 * כרטיס ניהול הגדרות אימייל - רשימת מיילי מזכירות
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של הגדרות אימייל
 * - Open/Closed: ניתן להרחיב עם הגדרות נוספות
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 * - כרטיס עם גרדיאנט
 * - צללים מעובים
 * - אייקונים עם רקע גרדיאנט
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Mail, Plus, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function EmailSettingsCard() {
  const t = useTranslations();

  // State
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);

  // Fetch emails on mount
  useEffect(() => {
    fetchEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/secretary-emails');

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error(t('email.settings.fetchError'), {
        description: t('email.settings.fetchErrorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = async () => {
    // Reset error
    setEmailError('');

    // Validate email
    if (!newEmail.trim()) {
      setEmailError(t('email.validation.emailRequired'));
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError(t('email.validation.invalidEmail'));
      return;
    }

    // Check if email already exists
    if (emails.includes(newEmail.trim())) {
      setEmailError(t('email.settings.emailExists'));
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/settings/secretary-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add email');
      }

      // Success
      setEmails(data.emails);
      setNewEmail('');
      toast.success(t('email.settings.emailAdded'), {
        description: t('email.settings.emailAddedDescription'),
      });
    } catch (error) {
      console.error('Error adding email:', error);
      toast.error(t('email.settings.addError'), {
        description: error instanceof Error ? error.message : t('common.error.unknown'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmail = async (email: string) => {
    // Check if this is the last email
    if (emails.length <= 1) {
      toast.error(t('email.settings.cannotDeleteLast'), {
        description: t('email.settings.cannotDeleteLastDescription'),
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/settings/secretary-emails', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete email');
      }

      // Success
      setEmails(data.emails);
      toast.success(t('email.settings.emailDeleted'), {
        description: t('email.settings.emailDeletedDescription'),
      });
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error(t('email.settings.deleteError'), {
        description: error instanceof Error ? error.message : t('common.error.unknown'),
      });
    } finally {
      setIsSaving(false);
      setAlertOpen(false);
      setEmailToDelete(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent opacity-60" />

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blue-900">
                {t('email.settings.title')}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {t('email.settings.description')}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1">
            {emails.length} {t('email.settings.emailsCount')}
          </Badge>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Add new email form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder={t('email.settings.addEmailPlaceholder')}
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError('');
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isSaving}
                  className={`border-2 ${emailError ? 'border-red-300' : 'border-blue-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                />
                {emailError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>
              <Button
                onClick={handleAddEmail}
                disabled={isSaving || !newEmail.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 me-2" />
                    {t('email.settings.addEmail')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Emails list */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-900">
              {t('email.settings.currentEmails')}
            </h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : emails.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-600">
                  {t('email.settings.noEmails')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-blue-100 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-900">{email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEmailToDelete(email);
                        setAlertOpen(true);
                      }}
                      disabled={isSaving || emails.length <= 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info message */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              <Check className="h-3 w-3 inline me-1" />
              {t('email.settings.infoMessage')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('email.settings.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('email.settings.confirmDeleteDescription', { email: emailToDelete || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emailToDelete && handleDeleteEmail(emailToDelete)}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
