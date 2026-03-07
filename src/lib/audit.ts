import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

export const logAudit = async (entry: AuditLogEntry) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs" as any).insert({
    user_id: user.id,
    action: entry.action,
    entity_type: entry.entity_type || null,
    entity_id: entry.entity_id || null,
    metadata: entry.metadata || {},
  });
};
