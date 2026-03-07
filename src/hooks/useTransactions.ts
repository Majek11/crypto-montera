import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Transaction } from "@/types";

interface UseTransactionsOptions {
    limit?: number;
}

export function useTransactions({ limit }: UseTransactionsOptions = {}) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Real-time subscription: invalidate the cache when transactions change
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel("transactions-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => {
                queryClient.invalidateQueries({ queryKey: ["transactions", user.id] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, queryClient]);

    return useQuery({
        queryKey: ["transactions", user?.id, limit],
        queryFn: async (): Promise<Transaction[]> => {
            if (!user) return [];
            let query = supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 30_000,
    });
}
