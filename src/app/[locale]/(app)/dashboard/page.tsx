import { getTranslations } from "next-intl/server";
import {
  DashboardStats,
  MiniCalendar,
  UpcomingWeddings,
  QuickActions,
  AlertsWidget,
  RecentActivity,
  WelcomeHeader,
} from "@/components/dashboard";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <WelcomeHeader />


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
