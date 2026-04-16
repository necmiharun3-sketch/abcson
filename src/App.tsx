import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import AppRoutes from "./routes/AppRoutes";
import { missingFirebaseEnvKeys } from "./firebase";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import {
  runAllAutomations,
  loadAutomationConfig,
} from "./services/automationService";

const INTERVAL_MS = 30 * 60 * 1000; // 30 dakika

function AutomationRunner() {
  const { profile } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    const run = async () => {
      try {
        const config = await loadAutomationConfig();
        await runAllAutomations(config);
      } catch {
        /* silent background */
      }
    };
    const delay = setTimeout(run, 8000);
    timerRef.current = setInterval(run, INTERVAL_MS);
    return () => {
      clearTimeout(delay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAdmin]);

  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <LanguageProvider>
                <BrowserRouter>
                  <AutomationRunner />
                  {missingFirebaseEnvKeys.length > 0 && (
                    <div className="max-w-[1400px] mx-auto px-4 pt-3">
                      <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-lg px-3 py-2">
                        Firebase env eksik: {missingFirebaseEnvKeys.join(", ")}.
                        Vercel Environment Variables alanına ekleyip redeploy
                        et.
                      </div>
                    </div>
                  )}
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      style: {
                        background: "#1a1b23",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight: "500",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      },
                      success: {
                        style: {
                          background:
                            "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)",
                          border: "1px solid rgba(34,197,94,0.5)",
                        },
                        iconTheme: {
                          primary: "#22c55e",
                          secondary: "#1a1b23",
                        },
                      },
                      error: {
                        style: {
                          background:
                            "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)",
                          border: "1px solid rgba(239,68,68,0.5)",
                        },
                        iconTheme: {
                          primary: "#ef4444",
                          secondary: "#1a1b23",
                        },
                      },
                      loading: {
                        style: {
                          background:
                            "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)",
                          border: "1px solid rgba(59,130,246,0.5)",
                        },
                        iconTheme: {
                          primary: "#3b82f6",
                          secondary: "#1a1b23",
                        },
                      },
                    }}
                  />
                  <AppRoutes />
                </BrowserRouter>
              </LanguageProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </HelmetProvider>
  );
}
