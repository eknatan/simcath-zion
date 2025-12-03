"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            אירעה שגיאה
          </h1>
          <p className="text-muted-foreground">
            משהו השתבש. אנא נסה שוב או חזור לדף הבית.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-muted/50 rounded-lg p-4 text-start overflow-auto max-h-32">
            <p className="text-sm font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            נסה שוב
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              חזור לדף הבית
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          אם הבעיה נמשכת, נסה לנקות את זיכרון הדפדפן (Ctrl+Shift+Delete) או לפתוח בחלון גלישה פרטית
        </p>
      </div>
    </div>
  );
}
