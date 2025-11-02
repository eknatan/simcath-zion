'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Bank {
  Bank_Code: string;
  Bank_Name: string;
}

interface Branch {
  Branch_Code: string;
  Branch_Name: string;
  Bank_Code: string;
  Bank_Name: string;
  Address?: string;
  City?: string;
}

interface BankSelectorProps {
  value?: string;
  onValueChange: (bankCode: string) => void;
  disabled?: boolean;
  className?: string;
}

interface BranchSelectorProps {
  bankCode?: string;
  value?: string;
  onValueChange: (branchCode: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Bank Selector Component
 * Allows searching and selecting a bank from data.gov.il
 */
export function BankSelector({
  value,
  onValueChange,
  disabled,
  className,
}: BankSelectorProps) {
  const locale = useLocale();
  const t = useTranslations('banks');
  const [open, setOpen] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchBanks() {
      setIsLoading(true);
      try {
        console.log('[BankSelector] Fetching banks...');
        const response = await fetch(`/api/banks?locale=${locale}`);
        if (!response.ok) {
          console.error('[BankSelector] API response not ok:', response.status, response.statusText);
          throw new Error('Failed to fetch banks');
        }
        const data = await response.json();
        console.log('[BankSelector] Fetched banks:', data.length, 'banks');
        setBanks(data);
      } catch (error) {
        console.error('[BankSelector] Error fetching banks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBanks();
  }, [locale]);

  const selectedBank = banks.find((bank) => bank.Bank_Code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || isLoading}
        >
          {selectedBank ? selectedBank.Bank_Name : t('selectBank')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder={t('searchBank')} />
          <CommandList>
            <CommandEmpty>{t('noBank')}</CommandEmpty>
            <CommandGroup>
              {banks.map((bank) => (
                <CommandItem
                  key={bank.Bank_Code}
                  value={`${bank.Bank_Code}-${bank.Bank_Name}`}
                  onSelect={() => {
                    onValueChange(bank.Bank_Code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === bank.Bank_Code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{bank.Bank_Name}</span>
                    <span className="text-xs text-slate-500">
                      {t('bankCode')} {bank.Bank_Code}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Branch Selector Component
 * Allows searching and selecting a branch from data.gov.il
 * Requires bankCode to be set first
 */
export function BranchSelector({
  bankCode,
  value,
  onValueChange,
  disabled,
  className,
}: BranchSelectorProps) {
  const locale = useLocale();
  const t = useTranslations('banks');
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bankCode) {
      setBranches([]);
      return;
    }

    async function fetchBranches() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/banks/${bankCode}/branches?locale=${locale}`);
        if (!response.ok) throw new Error('Failed to fetch branches');
        const data = await response.json();
        setBranches(data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBranches();
  }, [bankCode, locale]);

  // Custom filtering logic for partial/fuzzy matching
  const filteredBranches = useMemo(() => {
    if (!searchQuery) return branches;

    const query = searchQuery.trim().toLowerCase();

    return branches.filter((branch) => {
      const branchCode = String(branch.Branch_Code);
      const branchName = branch.Branch_Name?.toLowerCase() || '';
      const city = branch.City?.toLowerCase() || '';
      const address = branch.Address?.toLowerCase() || '';

      // Search in code, name, city, and address
      return (
        branchCode.includes(query) ||
        branchName.includes(query) ||
        city.includes(query) ||
        address.includes(query)
      );
    });
  }, [branches, searchQuery]);

  // Scroll to top when search results change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [searchQuery, filteredBranches]);

  const selectedBranch = branches.find((branch) => String(branch.Branch_Code) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || !bankCode || isLoading}
        >
          {selectedBranch ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedBranch.Branch_Code}</span>
              <span className="text-slate-600">-</span>
              <span>{selectedBranch.Branch_Name}</span>
            </div>
          ) : (
            t('selectBranch')
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('searchBranch')}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList ref={listRef}>
            <CommandEmpty>{t('noBranch')}</CommandEmpty>
            <CommandGroup>
              {filteredBranches.map((branch) => (
                <CommandItem
                  key={branch.Branch_Code}
                  value={`${branch.Branch_Code}-${branch.Branch_Name}`}
                  onSelect={() => {
                    onValueChange(String(branch.Branch_Code));
                    setSearchQuery('');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === String(branch.Branch_Code) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{branch.Branch_Code}</span>
                      <span className="text-slate-600">-</span>
                      <span className="font-medium">{branch.Branch_Name}</span>
                    </div>
                    {branch.Address && (
                      <span className="text-xs text-slate-500">
                        {branch.Address}
                        {branch.City && `, ${branch.City}`}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
