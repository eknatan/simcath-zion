"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PublicFormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public form error:", error);
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
            אירעה שגיאה בטעינת הטופס
          </h1>
          <p className="text-muted-foreground">
            משהו השתבש. אנא נסה לרענן את הדף.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={reset} variant="default" className="gap-2 w-full sm:w-auto">
            <RefreshCw className="h-4 w-4" />
            נסה שוב
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>אם הבעיה נמשכת, נסה:</p>
          <ul className="list-disc list-inside text-start mx-auto max-w-xs">
            <li>לנקות את זיכרון הדפדפן</li>
            <li>לפתוח בחלון גלישה פרטית</li>
            <li>להשתמש בדפדפן אחר</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
