import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import type { Investment } from "@/types";

export function useInvestments() {
    const { user } = useAuth();
    const { effectiveUserId } = useImpersonation();
    const queryClient = useQueryClient();
    const uid = effectiveUserId(user?.id);

    // Real-time subscription: invalidate whenever any investment changes
    useEffect(() => {
        if (!uid) return;
        const channel = supabase
            .channel("investments-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "investments", filter: `user_id=eq.${uid}` }, () => {
                queryClient.invalidateQueries({ queryKey: ["investments", uid] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [uid, queryClient]);

    return useQuery({
        queryKey: ["investments", uid],
        queryFn: async (): Promise<Investment[]> => {
            if (!uid) return [];
            const { data, error } = await supabase
                .from("investments")
                .select("*, investment_plans(*)")
                .eq("user_id", uid);
            if (error) throw new Error(error.message);
            return (data ?? []) as Investment[];
        },
        enabled: !!uid,
        staleTime: 30_000,
    });
}
