import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Investment } from "@/types";

export function useInvestments() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Real-time subscription: invalidate whenever any investment changes
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel("investments-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "investments", filter: `user_id=eq.${user.id}` }, () => {
                queryClient.invalidateQueries({ queryKey: ["investments", user.id] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, queryClient]);

    return useQuery({
        queryKey: ["investments", user?.id],
        queryFn: async (): Promise<Investment[]> => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("investments")
                .select("*, investment_plans(*)")
                .eq("user_id", user.id);
            if (error) throw new Error(error.message);
            return (data ?? []) as Investment[];
        },
        enabled: !!user,
        staleTime: 30_000,
    });
}
