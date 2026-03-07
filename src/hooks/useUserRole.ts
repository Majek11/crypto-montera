import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (data) setRoles(data.map((r) => r.role));
      setLoading(false);
    };
    fetchRoles();
  }, [user]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isEnterprise: roles.includes("enterprise"),
    loading,
  };
};
