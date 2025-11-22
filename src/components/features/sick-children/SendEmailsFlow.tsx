'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Eye,
  Send,
  X,
} from 'lucide-react';

interface FamilyEmailStatus {
  case_id: string;
  family_name: string;
  child_name: string;
  contact_email: string;
  contact_phone: string;
  last_email_sent: string | null;
  sent_this_month: boolean;
}

interface SendEmailsFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SendResult {
  sent: number;
  failed: number;
  errors: Array<{ case_id: string; email: string; error: string }>;
}

/**
 * SendEmailsFlow - Multi-step flow for sending monthly emails to families
 *
 * Steps:
 * 1. Select recipients
 * 2. Edit template (language & custom body)
 * 3. Preview email
 * 4. Confirm & send + results
 */
export function SendEmailsFlow({ open, onOpenChange, onSuccess }: SendEmailsFlowProps) {
  const t = useTranslations('sickChildren.email');
  const tCommon = useTranslations('common');

  // Step state (0-3)
  const [currentStep, setCurrentStep] = useState(0);

  // Data state
  const [families, setFamilies] = useState<FamilyEmailStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Selection state
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(new Set());

  // Template state
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [customBody, setCustomBody] = useState('');

  // Results state
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Fetch families when dialog opens
  useEffect(() => {
    async function fetchFamilies() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/cleaning-cases/email-status');

        if (response.ok) {
          const data = await response.json();
          setFamilies(data || []);

          // Pre-select families who haven't received email this month
          const initialSelected = new Set<string>();
          data?.forEach((family: FamilyEmailStatus) => {
            if (!family.sent_this_month && family.contact_email) {
              initialSelected.add(family.case_id);
            }
          });
          setSelectedFamilies(initialSelected);
        }
      } catch (error) {
        console.error('Error fetching families:', error);
        toast.error(t('failed'));
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchFamilies();
      // Reset state when opening
      setCurrentStep(0);
      setLanguage('he');
      setCustomBody('');
      setSendResult(null);
    }
  }, [open, t]);

  // Toggle family selection
  const toggleFamily = (caseId: string) => {
    setSelectedFamilies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  // Select/deselect all families with email
  const toggleAll = () => {
    const eligibleFamilies = families.filter(f => f.contact_email);
    if (selectedFamilies.size === eligibleFamilies.length) {
      setSelectedFamilies(new Set());
    } else {
      setSelectedFamilies(new Set(eligibleFamilies.map(f => f.case_id)));
    }
  };

  // Count families already sent this month
  const alreadySentCount = useMemo(() => {
    return Array.from(selectedFamilies).filter(id => {
      const family = families.find(f => f.case_id === id);
      return family?.sent_this_month;
    }).length;
  }, [selectedFamilies, families]);

  // Handle send emails
  const handleSend = async () => {
    if (selectedFamilies.size === 0) return;

    setIsSending(true);
    try {
      // Prepare recipients
      const recipients = Array.from(selectedFamilies)
        .map(caseId => {
          const family = families.find(f => f.case_id === caseId);
          if (!family || !family.contact_email) return null;
          return {
            case_id: family.case_id,
            email: family.contact_email,
            family_name: family.family_name,
            child_name: family.child_name,
          };
        })
        .filter(Boolean);

      const response = await fetch('/api/cleaning-cases/send-monthly-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          language,
          custom_body: customBody || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t('failed'));
        return;
      }

      // Set results and show results view
      setSendResult(data);

      if (data.sent > 0) {
        toast.success(t('success', { count: data.sent }));
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error(t('failed'));
    } finally {
      setIsSending(false);
    }
  };

  // Handle close
  const handleClose = () => {
    onOpenChange(false);
    if (sendResult && sendResult.sent > 0) {
      onSuccess?.();
    }
  };

  // Navigate steps
  const goNext = () => {
    if (currentStep === 3) {
      handleSend();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const goBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Steps configuration
  const steps = [
    { id: 'select', label: t('steps.selectRecipients') },
    { id: 'template', label: t('steps.editTemplate') },
    { id: 'preview', label: t('steps.previewEmail') },
    { id: 'send', label: t('steps.sendConfirm') },
  ];

  // Render step content
  const renderStepContent = () => {
    // Show results after sending
    if (sendResult) {
      return (
        <div className="space-y-4 p-4">
          <div className="text-center space-y-4">
            {sendResult.sent > 0 && (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
                <span className="text-xl font-semibold">
                  {t('sentCount', { count: sendResult.sent })}
                </span>
              </div>
            )}
            {sendResult.failed > 0 && (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <X className="h-8 w-8" />
                <span className="text-xl font-semibold">
                  {t('failedCount', { count: sendResult.failed })}
                </span>
              </div>
            )}
          </div>

          {sendResult.errors.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">{t('errorDetails')}:</Label>
              <div className="mt-2 max-h-40 overflow-auto border rounded-lg p-2 bg-red-50">
                {sendResult.errors.map((err, index) => (
                  <div key={index} className="text-sm text-red-700 py-1">
                    <span className="font-medium">{err.email}</span>: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (currentStep) {
      case 0: // Select recipients
        return (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Families Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : families.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  {t('noFamilies')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            families.filter(f => f.contact_email).length > 0 &&
                            selectedFamilies.size === families.filter(f => f.contact_email).length
                          }
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>שם משפחה</TableHead>
                      <TableHead>שם ילד</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>{t('phone')}</TableHead>
                      <TableHead className="w-32">סטטוס</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((family) => (
                      <TableRow
                        key={family.case_id}
                        className={!family.contact_email ? 'bg-slate-50 opacity-60' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedFamilies.has(family.case_id)}
                            onCheckedChange={() => toggleFamily(family.case_id)}
                            disabled={!family.contact_email}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {family.family_name}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {family.child_name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {family.contact_email || (
                            <span className="text-slate-400">{t('noEmail')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone className="h-3 w-3" />
                            {family.contact_phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {family.sent_this_month ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 me-1" />
                              נשלח החודש
                            </Badge>
                          ) : !family.contact_email ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                              {t('noEmail')}
                            </Badge>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Warning for already sent */}
            {alreadySentCount > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  {t('warningAlreadySent', { count: alreadySentCount })}
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">
                {t('selectedCount', { count: selectedFamilies.size })}
              </div>
            </div>
          </div>
        );

      case 1: // Edit template
        return (
          <div className="space-y-4 p-4">
            {/* Language selection */}
            <div className="space-y-2">
              <Label>{t('language')}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'he' | 'en')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">{t('hebrew')}</SelectItem>
                  <SelectItem value="en">{t('english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom body */}
            <div className="space-y-2">
              <Label>{t('body')}</Label>
              <Textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder={language === 'he'
                  ? 'השאר ריק לשימוש בתבנית ברירת מחדל...'
                  : 'Leave empty to use default template...'}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                {t('variables')}
              </p>
            </div>
          </div>
        );

      case 2: // Preview
        return (
          <div className="space-y-4 p-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Eye className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {t('previewNote')}
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 bg-white">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="font-medium text-slate-600">{t('language')}:</span>
                  <span>{language === 'he' ? t('hebrew') : t('english')}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-slate-600">{t('body')}:</span>
                  <span>{customBody ? t('customBody') : t('defaultBody')}</span>
                </div>
              </div>

              {customBody && (
                <div className="mt-4 p-3 bg-slate-50 rounded border text-sm whitespace-pre-wrap">
                  {customBody}
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Confirm & send
        return (
          <div className="space-y-4 p-4">
            <div className="text-center space-y-4">
              <Mail className="h-16 w-16 text-blue-500 mx-auto" />
              <p className="text-lg">
                {t('confirmSend', { count: selectedFamilies.size })}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('totalToSend', { count: selectedFamilies.size })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('language')}:</span>
                <span>{language === 'he' ? t('hebrew') : t('english')}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Can proceed to next step?
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedFamilies.size > 0;
      case 1:
      case 2:
        return true;
      case 3:
        return !isSending;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1400px] w-[98vw] min-h-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {/* Step indicator */}
            {!sendResult && (
              <div className="flex items-center gap-2 mt-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index < currentStep
                          ? 'bg-emerald-500 text-white'
                          : index === currentStep
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-1 ${
                        index < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {renderStepContent()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {sendResult ? (
            <Button onClick={handleClose}>
              {t('done')}
            </Button>
          ) : (
            <>
              {currentStep > 0 && (
                <Button variant="outline" onClick={goBack} disabled={isSending}>
                  <ChevronRight className="h-4 w-4 me-1" />
                  {t('back')}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={goNext}
                disabled={!canProceed() || isSending}
                className={currentStep === 3 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('sending')}
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Send className="h-4 w-4 me-2" />
                    {t('sendNow')}
                  </>
                ) : (
                  <>
                    {t('next')}
                    <ChevronLeft className="h-4 w-4 ms-1" />
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
