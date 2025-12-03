"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "4rem",
                marginBottom: "1rem",
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#1a1a1a",
              }}
            >
              אירעה שגיאה
            </h1>

            <p
              style={{
                color: "#666",
                marginBottom: "1.5rem",
              }}
            >
              משהו השתבש בטעינת האפליקציה. אנא נסה שוב.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                נסה שוב
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "white",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                חזור לדף הבית
              </button>
            </div>

            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: "#999",
              }}
            >
              אם הבעיה נמשכת, נסה לנקות את זיכרון הדפדפן או לפתוח בחלון גלישה פרטית
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
