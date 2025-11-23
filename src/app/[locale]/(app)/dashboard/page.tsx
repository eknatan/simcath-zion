import { getTranslations } from "next-intl/server";
import {
  DashboardStats,
  MiniCalendar,
  UpcomingWeddings,
  QuickActions,
  AlertsWidget,
  RecentActivity,
} from "@/components/dashboard";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-lg text-slate-600">{t("description")}</p>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Mini Calendar */}
        <div className="lg:col-span-1">
          <MiniCalendar />
        </div>

        {/* Middle Column - Upcoming Weddings */}
        <div className="lg:col-span-1">
          <UpcomingWeddings />
        </div>

        {/* Right Column - Alerts */}
        <div className="lg:col-span-1">
          <AlertsWidget />
        </div>
      </div>

      {/* Quick Actions - Full Width */}
      <QuickActions />

      {/* Recent Activity - Full Width */}
      <RecentActivity />
    </div>
  );
}
