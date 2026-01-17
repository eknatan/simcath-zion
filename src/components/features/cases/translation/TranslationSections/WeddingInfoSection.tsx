'use client';

import { FormField } from '@/components/shared/Forms/FormField';
import {
  Calendar,
  MapPin,
  Users,
  Banknote,
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
    { key: 'total_cost', label: 'Total Cost (ILS)', icon: Banknote },
    { key: 'request_background', label: 'Background Information', icon: FileText },
  ];

  const handleSaveField = async (field: string, value: any) => {
    return await onSaveField('wedding_info', field, value);
  };

  // Format currency values with ILS symbol
  const formatValue = (key: string, value: any) => {
    if (key === 'total_cost' && value) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        return `₪${numValue.toLocaleString()}`;
      }
    }
    return value || '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr" style={{ direction: 'ltr' }}>
      {fields.map(({ key, label, icon: Icon }) => {
        const rawValue = weddingInfo?.[key as keyof typeof weddingInfo];
        const displayValue = formatValue(key, rawValue);

        return (
          <div key={key} dir="ltr" style={{ direction: 'ltr' }}>
            <FormField
              name={key}
              label={label}
              type={key === 'request_background' ? 'textarea' : key.includes('count') || key.includes('cost') ? 'number' : 'text'}
              value={displayValue}
              onSave={isEditing ? (value) => handleSaveField(key, value) : undefined}
              notSpecifiedText="Not specified"
              icon={<Icon className="h-4 w-4" />}
            />
          </div>
        );
      })}
    </div>
  );
}