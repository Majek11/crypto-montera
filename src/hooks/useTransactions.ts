import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import type { Transaction } from "@/types";

interface UseTransactionsOptions {
    limit?: number;
}

export function useTransactions({ limit }: UseTransactionsOptions = {}) {
    const { user } = useAuth();
    const { effectiveUserId } = useImpersonation();
    const queryClient = useQueryClient();
    const uid = effectiveUserId(user?.id);

    // Real-time subscription: invalidate the cache when transactions change
    useEffect(() => {
        if (!uid) return;
        const channel = supabase
            .channel("transactions-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${uid}` }, () => {
                queryClient.invalidateQueries({ queryKey: ["transactions", uid] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [uid, queryClient]);

    return useQuery({
        queryKey: ["transactions", uid, limit],
        queryFn: async (): Promise<Transaction[]> => {
            if (!uid) return [];
            let query = supabase
                .from("transactions")
                .select("*")
                .eq("user_id", uid)
                .order("created_at", { ascending: false });
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data ?? [];
        },
        enabled: !!uid,
        staleTime: 30_000,
    });
}
