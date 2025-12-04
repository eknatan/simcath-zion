'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

export interface ManualTransferFiltersType {
  search?: string;
  date_from?: string;
  date_to?: string;
}

interface ManualTransferFiltersProps {
  filters: ManualTransferFiltersType;
  onChange: (filters: ManualTransferFiltersType) => void;
  onReset: () => void;
}

export function ManualTransferFilters({
  filters,
  onChange,
  onReset,
}: ManualTransferFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key: keyof ManualTransferFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/20">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search - Takes 2 columns */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search" className="text-sm font-medium text-slate-700">
              חיפוש
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="שם מקבל או תעודת זהות"
              value={localFilters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="border-slate-200"
            />
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-sm font-medium text-slate-700">
              מתאריך
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={localFilters.date_from || ''}
              onChange={(e) => handleChange('date_from', e.target.value)}
              className="border-slate-200"
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-sm font-medium text-slate-700">
              עד תאריך
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={localFilters.date_to || ''}
              onChange={(e) => handleChange('date_to', e.target.value)}
              className="border-slate-200"
            />
          </div>

          {/* Clear Filters Button - Full width on mobile, aligns at end on desktop */}
          <div className="flex items-end lg:col-start-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <X className="w-4 h-4 me-2" />
              נקה סינונים
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
