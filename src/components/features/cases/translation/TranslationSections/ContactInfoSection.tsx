'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/shared/Forms/FormField';
import { MapPin, Phone, Mail } from 'lucide-react';
import type { TranslatedContent } from '@/types/case.types';

interface ContactInfoSectionProps {
  contactInfo: TranslatedContent['contact_info'];
  isEditing: boolean;
  onSaveField: (section: 'contact_info', field: string, value: any) => Promise<boolean>;
}

export function ContactInfoSection({ contactInfo, isEditing, onSaveField }: ContactInfoSectionProps) {
  const fields = [
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'phone', label: 'Phone Number', icon: Phone },
    { key: 'email', label: 'Email Address', icon: Mail },
  ];

  const handleSaveField = async (field: string, value: any) => {
    return await onSaveField('contact_info', field, value);
  };

  return (
    <Card dir="ltr">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Phone className="h-5 w-5 text-slate-600" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr">
          {fields.map(({ key, label, icon: Icon }) => (
            <div key={key} dir="ltr" style={{ direction: 'ltr' }}>
              <FormField
                name={key}
                label={label}
                type={key === 'email' ? 'email' : 'text'}
                value={contactInfo?.[key as keyof typeof contactInfo] || ''}
                onSave={isEditing ? (value) => handleSaveField(key, value) : undefined}
                notSpecifiedText="Not specified"
                icon={<Icon className="h-4 w-4" />}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}