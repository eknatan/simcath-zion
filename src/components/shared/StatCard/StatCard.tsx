import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'orange' | 'indigo' | 'red' | 'purple';
  trend?: {
    value: string;
    label: string;
    icon?: LucideIcon;
  };
  className?: string;
}

/**
 * StatCard Component - Version B (Elegant & Soft)
 *
 * קומפוננט כרטיס סטטיסטיקה עם עיצוב אלגנטי ורך
 * תומך בצבעים שונים וב-optional trend indicator
 *
 * @example
 * <StatCard
 *   title="סה״כ תיקים"
 *   value={248}
 *   description="תיקים פעילים במערכת"
 *   icon={FileText}
 *   colorScheme="blue"
 *   trend={{
 *     value: "+12%",
 *     label: "מהחודש שעבר",
 *     icon: TrendingUp
 *   }}
 * />
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  colorScheme = 'blue',
  trend,
  className,
}: StatCardProps) {
  // Color mappings for Version B
  const colorClasses = {
    blue: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-blue-50/30',
      iconBg: 'bg-blue-100 border border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-900',
      trendColor: 'text-blue-600',
      trendIconColor: 'text-blue-500',
    },
    emerald: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-emerald-50/30',
      iconBg: 'bg-emerald-100 border border-emerald-200',
      iconColor: 'text-emerald-600',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-900',
      trendColor: 'text-emerald-600',
      trendIconColor: 'text-emerald-500',
    },
    orange: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-orange-50/30',
      iconBg: 'bg-orange-100 border border-orange-200',
      iconColor: 'text-orange-600',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-900',
      trendColor: 'text-orange-600',
      trendIconColor: 'text-orange-500',
    },
    indigo: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-indigo-50/30',
      iconBg: 'bg-indigo-100 border border-indigo-200',
      iconColor: 'text-indigo-600',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-900',
      trendColor: 'text-indigo-600',
      trendIconColor: 'text-indigo-500',
    },
    red: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-red-50/30',
      iconBg: 'bg-red-100 border border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-900',
      trendColor: 'text-red-600',
      trendIconColor: 'text-red-500',
    },
    purple: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-purple-50/30',
      iconBg: 'bg-purple-100 border border-purple-200',
      iconColor: 'text-purple-600',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-900',
      trendColor: 'text-purple-600',
      trendIconColor: 'text-purple-500',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <Card
      className={cn(
        'relative overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300',
        colors.card,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={cn('text-sm font-semibold', colors.titleColor)}>
          {title}
        </CardTitle>
        <div
          className={cn(
            'h-11 w-11 rounded-lg flex items-center justify-center',
            colors.iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', colors.iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold', colors.valueColor)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {trend.icon && (
              <trend.icon className={cn('h-3 w-3', colors.trendIconColor)} />
            )}
            <span className={cn('font-medium', colors.trendColor)}>
              {trend.value}
            </span>{' '}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
