/**
 * Application-wide TypeScript types derived from the Supabase database schema.
 * Import these instead of using `any` throughout the codebase.
 */

import type { Database } from "@/integrations/supabase/types";

// ─── Enum aliases ────────────────────────────────────────────────────────────

export type AppRole = Database["public"]["Enums"]["app_role"];
export type InvestmentStatus = Database["public"]["Enums"]["investment_status"];
export type KycStatus = Database["public"]["Enums"]["kyc_status"];
export type PlanRiskLevel = Database["public"]["Enums"]["plan_risk_level"];
export type TransactionStatus = Database["public"]["Enums"]["transaction_status"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];

// ─── Row types (straight from DB) ────────────────────────────────────────────

export type InvestmentPlan = Database["public"]["Tables"]["investment_plans"]["Row"];
export type KycVerification = Database["public"]["Tables"]["kyc_verifications"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// ─── Extended / joined types ──────────────────────────────────────────────────

/** Investment row with its related investment_plans data joined */
export interface Investment {
    id: string;
    user_id: string;
    plan_id: string;
    amount: number;
    current_value: number | null;
    total_return: number | null;
    status: InvestmentStatus;
    started_at: string;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    /** Joined from investment_plans */
    investment_plans?: InvestmentPlan | null;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
    totalInvested: number;
    totalValue: number;
    pnl: number;
    pnlPercent: string;
    walletBalance: number;
    activeInvestments: number;
    bestPerformer: { name: string; change: number };
}

// ─── Chain / Currency constants types ────────────────────────────────────────

export interface Chain {
    id: string;
    name: string;
    symbol: string;
    color: string;
}
