/**
 * Shared constants used across the deposit, withdraw, and wallet pages.
 * Centralised here to avoid duplication and drift.
 */

import type { Chain } from "@/types";

// ─── Supported chains ─────────────────────────────────────────────────────────

export const CHAINS: Chain[] = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH", color: "bg-blue-400/10 text-blue-400" },
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC", color: "bg-amber-400/10 text-amber-400" },
    { id: "solana", name: "Solana", symbol: "SOL", color: "bg-purple-400/10 text-purple-400" },
    { id: "bsc", name: "BSC", symbol: "BNB", color: "bg-amber-300/10 text-amber-300" },
    { id: "polygon", name: "Polygon", symbol: "MATIC", color: "bg-violet-400/10 text-violet-400" },
];

// ─── Supported currencies ─────────────────────────────────────────────────────

export const CURRENCIES = ["USDT", "USDC", "ETH", "BTC", "SOL", "BNB"] as const;
export type Currency = (typeof CURRENCIES)[number];

// ─── Supported chains for wallet selection (no colour needed) ─────────────────

export const WALLET_CHAINS = [
    "ethereum",
    "bitcoin",
    "solana",
    "polygon",
    "avalanche",
    "bsc",
] as const;
export type WalletChain = (typeof WALLET_CHAINS)[number];

// ─── Platform deposit wallet addresses (REPLACE WITH YOUR REAL ADDRESSES) ──────
// These are Montera's receiving wallets. Users send funds here to deposit.

export const PLATFORM_DEPOSIT_ADDRESSES: Record<string, string> = {
    ethereum: "0xYourEthereumWalletAddressHere",
    bitcoin: "bc1YourBitcoinWalletAddressHere",
    solana: "YourSolanaWalletAddressHere",
    bsc: "0xYourBSCWalletAddressHere",
    polygon: "0xYourPolygonWalletAddressHere",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Default number of rows fetched per page in paginated lists */
export const PAGE_SIZE = 20;
