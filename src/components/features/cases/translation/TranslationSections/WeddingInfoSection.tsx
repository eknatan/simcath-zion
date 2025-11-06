'use client';

import { FormField } from '@/components/shared/Forms/FormField';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText
} from 'lucide-react';
import type { TranslatedContent } from '@/types/case.types';

interface WeddingInfoSectionProps {
  weddingInfo: TranslatedContent['wedding_info'];
  isEditing: boolean;
  onSaveField: (section: 'wedding_info', field: string, value: any) => Promise<boolean>;
}

export function WeddingInfoSection({ weddingInfo, isEditing, onSaveField }: WeddingInfoSectionProps) {
  const fields = [
    { key: 'wedding_date_hebrew', label: 'Hebrew Wedding Date', icon: Calendar },
    { key: 'wedding_date_gregorian', label: 'Gregorian Wedding Date', icon: Calendar },
    { key: 'city', label: 'City', icon: MapPin },
    { key: 'venue', label: 'Venue', icon: MapPin },
    { key: 'guests_count', label: 'Number of Guests', icon: Users },
    { key: 'total_cost', label: 'Total Cost (USD)', icon: DollarSign },
    { key: 'request_background', label: 'Background Information', icon: FileText },
  ];

  const handleSaveField = async (field: string, value: any) => {
    return await onSaveField('wedding_info', field, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr" style={{ direction: 'ltr' }}>
      {fields.map(({ key, label, icon: Icon }) => (
        <div key={key} dir="ltr" style={{ direction: 'ltr' }}>
          <FormField
            name={key}
            label={label}
            type={key === 'request_background' ? 'textarea' : key.includes('count') || key.includes('cost') ? 'number' : 'text'}
            value={weddingInfo?.[key as keyof typeof weddingInfo] || ''}
            onSave={isEditing ? (value) => handleSaveField(key, value) : undefined}
            notSpecifiedText="Not specified"
            icon={<Icon className="h-4 w-4" />}
          />
        </div>
      ))}
    </div>
  );
}