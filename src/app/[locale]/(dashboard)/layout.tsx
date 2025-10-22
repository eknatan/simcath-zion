import { AuthProvider } from '@/contexts/AuthContext';
import { ReactQueryProvider } from '@/lib/providers/ReactQueryProvider';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ReactQueryProvider>
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

          {/* Toast Notifications */}
          <Toaster position="top-center" richColors />
        </div>
      </ReactQueryProvider>
    </AuthProvider>
  );
}
