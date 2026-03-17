/**
 * Shared constants used across the deposit, withdraw, and wallet pages.
 * Centralised here to avoid duplication and drift.
 *
 * NOTE: Wallet addresses here are the static fallback.
 * The admin can override them at runtime via Admin → Wallet Settings,
 * which stores values in the `platform_settings` Supabase table.
 */

import type { Chain } from "@/types";

// ─── Supported chains ─────────────────────────────────────────────────────────

export const CHAINS: Chain[] = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH", color: "bg-blue-400/10 text-blue-400" },
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC", color: "bg-amber-400/10 text-amber-400" },
    { id: "usdt_trc20", name: "USDT (TRC20)", symbol: "USDT", color: "bg-emerald-400/10 text-emerald-400" },
    { id: "solana", name: "Solana", symbol: "SOL", color: "bg-purple-400/10 text-purple-400" },
    { id: "bsc", name: "BNB Smart Chain", symbol: "BNB", color: "bg-amber-300/10 text-amber-300" },
];

// ─── Supported currencies ─────────────────────────────────────────────────────

export const CURRENCIES = ["USDT", "USDC", "ETH", "BTC", "SOL", "BNB"] as const;
export type Currency = (typeof CURRENCIES)[number];

// ─── Supported chains for wallet selection (no colour needed) ─────────────────

export const WALLET_CHAINS = [
    "ethereum",
    "bitcoin",
    "usdt_trc20",
    "solana",
    "bsc",
] as const;
export type WalletChain = (typeof WALLET_CHAINS)[number];

// ─── Static fallback deposit wallet addresses ─────────────────────────────────
// The Deposit page will first attempt to read live addresses from Supabase
// (platform_settings table).  These values are used as a fallback if the DB
// table has not been created yet or is unreachable.

export const PLATFORM_DEPOSIT_ADDRESSES: Record<string, string> = {
    ethereum: "0xD379091d53aB2AC2998dCf9ee0471F0a358B05E2",
    bitcoin: "bc1q87td8rzqppk88637x68gnakh68ustt58jmgs6e",
    usdt_trc20: "TH7K84Z1VLyxLFGXo66Hmxh4VTXqcVttVA",
    solana: "21vuzKftBCqeuhustJeinAhjjMFXVMdAooiBUkszksTk",
    bsc: "0xD379091d53aB2AC2998dCf9ee0471F0a358B05E2",
};

// ─── Wallet metadata for Admin UI ────────────────────────────────────────────

export const WALLET_META: Record<string, { label: string; note: string }> = {
    ethereum: { label: "Ethereum (ERC20)", note: "Accepts ETH, USDC, USDT (ERC20) and other ERC20 tokens" },
    bitcoin: { label: "Bitcoin (BTC)", note: "Native Bitcoin – Bech32 / SegWit address" },
    usdt_trc20: { label: "USDT (TRC20 / Tron)", note: "⚠️ TRC20 USDT only – do NOT send ERC20 USDT here" },
    solana: { label: "Solana (SOL)", note: "Accepts SOL and SPL tokens" },
    bsc: { label: "BNB Smart Chain (BEP-20)", note: "Accepts BNB, BUSD and BEP-20 tokens" },
};

// ─── Enterprise plan threshold ────────────────────────────────────────────────
// Plans with min_investment >= this value show "Contact Us" instead of "Invest Now"

export const ENTERPRISE_THRESHOLD = 200_000;
export const ENTERPRISE_EMAIL = "investment@monteracrypto.com";

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Default number of rows fetched per page in paginated lists */
export const PAGE_SIZE = 20;
