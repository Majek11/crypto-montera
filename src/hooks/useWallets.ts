import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Wallet } from "@/types";

export function useWallets() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel("wallets-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => {
                queryClient.invalidateQueries({ queryKey: ["wallets", user.id] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, queryClient]);

    return useQuery({
        queryKey: ["wallets", user?.id],
        queryFn: async (): Promise<Wallet[]> => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("wallets")
                .select("*")
                .eq("user_id", user.id)
                .order("is_primary", { ascending: false });
            if (error) throw new Error(error.message);
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 60_000,
    });
}
