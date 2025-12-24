import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SupportChat } from '@/components/support-chat/SupportChat';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      <Header />

      <div className="flex flex-1">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden w-64 lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <Sidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container py-6 px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Support Chat FAB */}
      <SupportChat />
    </div>
  );
}
