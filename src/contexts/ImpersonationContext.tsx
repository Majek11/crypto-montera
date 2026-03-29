/**
 * ImpersonationContext
 *
 * Allows admins to "view as user" — loads that user's profile into context
 * so data-fetching hooks can use their ID instead of the admin's own ID.
 *
 * SECURITY NOTE: This is a read/write-as-admin simulation. The admin's actual
 * Supabase session never changes. All data writes (if any) still go through
 * the admin's session and will be blocked by RLS unless the admin has
 * bypass permissions. This is intentional — impersonation is read-oriented
 * for support diagnosis.
 */

import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
    useEffect,
} from "react";

const STORAGE_KEY = "monetra_impersonation";

export interface ImpersonatedUser {
    user_id: string;
    email: string;
    display_name: string | null;
    balance: number;
    status: string;
}

interface ImpersonationContextType {
    impersonatedUser: ImpersonatedUser | null;
    isImpersonating: boolean;
    startImpersonation: (user: ImpersonatedUser) => void;
    stopImpersonation: () => void;
    /** The effective user ID to use in queries — impersonated if active, else real user */
    effectiveUserId: (realUserId: string | undefined) => string | undefined;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => {
    const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const startImpersonation = useCallback((user: ImpersonatedUser) => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        setImpersonatedUser(user);
    }, []);

    const stopImpersonation = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setImpersonatedUser(null);
    }, []);

    const effectiveUserId = useCallback(
        (realUserId: string | undefined) => {
            return impersonatedUser ? impersonatedUser.user_id : realUserId;
        },
        [impersonatedUser]
    );

    // Safety: clear on window close (tab close). If the tab stays open, sessionStorage persists.
    useEffect(() => {
        return () => {
            // If you want to auto-clear on full app unmount (rare), uncomment:
            // sessionStorage.removeItem(STORAGE_KEY);
        };
    }, []);

    return (
        <ImpersonationContext.Provider
            value={{ impersonatedUser, isImpersonating: !!impersonatedUser, startImpersonation, stopImpersonation, effectiveUserId }}
        >
            {children}
        </ImpersonationContext.Provider>
    );
};

export const useImpersonation = () => {
    const ctx = useContext(ImpersonationContext);
    if (!ctx) throw new Error("useImpersonation must be used within ImpersonationProvider");
    return ctx;
};
