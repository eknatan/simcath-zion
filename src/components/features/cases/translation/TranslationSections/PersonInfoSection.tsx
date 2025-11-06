'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/shared/Forms/FormField';
import { User } from 'lucide-react';
import type { TranslatedContent } from '@/types/case.types';

interface PersonInfoSectionProps {
  title: string;
  personInfo: TranslatedContent['groom_info'] | TranslatedContent['bride_info'];
  sectionKey: 'groom_info' | 'bride_info';
  isEditing: boolean;
  onSaveField: (section: 'groom_info' | 'bride_info', field: string, value: any) => Promise<boolean>;
}

export function PersonInfoSection({
  title,
  personInfo,
  sectionKey,
  isEditing,
  onSaveField
}: PersonInfoSectionProps) {
  const fields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'id_number', label: 'ID Number' },
    { key: 'school', label: 'School' },
    { key: 'father_name', label: "Father's Name" },
    { key: 'mother_name', label: "Mother's Name" },
    { key: 'memorial_day', label: 'Memorial Day' },
  ];

  const handleSaveField = async (field: string, value: any) => {
    return await onSaveField(sectionKey, field, value);
  };

  return (
    <Card dir="ltr" style={{ direction: 'ltr' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <User className="h-5 w-5 text-slate-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr" style={{ direction: 'ltr' }}>
          {fields.map(({ key, label }) => (
            <FormField
              key={key}
              name={key}
              label={label}
              type="text"
              value={personInfo?.[key as keyof typeof personInfo] || ''}
              onSave={isEditing ? (value) => handleSaveField(key, value) : undefined}
              notSpecifiedText="Not specified"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}