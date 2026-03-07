import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

// Pages where we hide the chat bubble (e.g. admin panel — agents don't
// need to chat with themselves)
const HIDDEN_PATHS = ["/admin", "/admin/users", "/admin/kyc", "/admin/transactions", "/admin/analytics", "/admin/plans", "/admin/bonus"];

// Declare the globals injected by the Tawk.to bootstrap script in index.html
declare global {
    interface Window {
        Tawk_API: {
            setAttributes: (attrs: Record<string, string>, cb?: (err: unknown) => void) => void;
            hideWidget: () => void;
            showWidget: () => void;
            maximize: () => void;
            minimize: () => void;
            onLoad?: () => void;
            onChatStarted?: () => void;
        };
        Tawk_LoadStart: Date;
    }
}

/**
 * TawkToChat
 *
 * Drop this once inside AppLayout and the public layout.
 * It does three things automatically:
 *  1. When a logged-in user is detected, passes their name + email to
 *     Tawk.to so agents see "John Doe (john@example.com)" instead of "Visitor"
 *  2. Hides the widget on admin pages (agents manage from the Tawk.to dashboard)
 *  3. Shows the widget everywhere else
 */
const TawkToChat = () => {
    const { user } = useAuth();
    const location = useLocation();
    const identifiedRef = useRef(false);

    // ── Identify the user once Tawk has loaded ───────────────────────────────
    useEffect(() => {
        if (!user || identifiedRef.current) return;

        const displayName =
            user.user_metadata?.display_name ||
            user.email?.split("@")[0] ||
            "User";

        const setVisitor = () => {
            try {
                window.Tawk_API?.setAttributes(
                    {
                        name: displayName,
                        email: user.email ?? "",
                        // Custom attribute so you can filter chats by user status in
                        // your Tawk.to dashboard
                        userId: user.id,
                    },
                    (err) => {
                        if (err) console.warn("[Tawk.to] setAttributes error:", err);
                    }
                );
                identifiedRef.current = true;
            } catch {
                // Tawk API not yet ready — will retry via onLoad
            }
        };

        // If Tawk has already loaded, call immediately; otherwise queue via onLoad
        if (window.Tawk_API?.setAttributes) {
            setVisitor();
        } else {
            // Tawk fires onLoad once the widget iframe is ready
            const existingOnLoad = window.Tawk_API?.onLoad;
            window.Tawk_API = window.Tawk_API || ({} as any);
            window.Tawk_API.onLoad = () => {
                existingOnLoad?.();
                setVisitor();
            };
        }
    }, [user]);

    // ── Show / hide based on current route ───────────────────────────────────
    useEffect(() => {
        const isAdminPage = HIDDEN_PATHS.some((p) => location.pathname.startsWith(p));

        const toggle = () => {
            try {
                if (isAdminPage) {
                    window.Tawk_API?.hideWidget();
                } else {
                    window.Tawk_API?.showWidget();
                }
            } catch {
                // Widget not ready yet — safe to ignore
            }
        };

        // Run now, and also queue for when Tawk finishes loading
        toggle();
        const existing = window.Tawk_API?.onLoad;
        window.Tawk_API = window.Tawk_API || ({} as any);
        const prev = window.Tawk_API.onLoad;
        window.Tawk_API.onLoad = () => {
            prev?.();
            toggle();
        };
    }, [location.pathname]);

    // This component renders nothing — it's purely a side-effect manager
    return null;
};

export default TawkToChat;
