import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreVertical, Ban, CheckCircle, Shield, Eye, UserX, UserCheck, Wallet, DollarSign, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const statusFilters = ["All", "Active", "Suspended", "Banned"];

const AdminUsers = () => {
  const navigate = useNavigate();
  const { startImpersonation, stopImpersonation } = useImpersonation();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; user: any | null; action: string }>({
    open: false, user: null, action: "",
  });
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Credit wallet state
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; user: any | null }>({
    open: false, user: null,
  });
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditUserBalance, setCreditUserBalance] = useState<number | null>(null);
  const [loadingCreditBalance, setLoadingCreditBalance] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: userRoles } = await supabase.from("user_roles").select("*");

    if (profiles) setUsers(profiles);
    if (userRoles) {
      const roleMap: Record<string, string[]> = {};
      userRoles.forEach((r) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });
      setRoles(roleMap);
    }
    setLoading(false);
  };

  // Clear any active impersonation when admin returns to this page
  useEffect(() => { stopImpersonation(); }, []);

  useEffect(() => { fetchUsers(); }, []);

  const loginAsUser = (u: any) => {
    startImpersonation({
      user_id: u.user_id,
      email: u.email,
      display_name: u.display_name,
      balance: Number(u.balance ?? 0),
      status: u.status ?? "active",
    });
    navigate("/dashboard");
  };

  const openCreditDialog = async (user: any) => {
    setCreditAmount("");
    setCreditNote("");
    setCreditUserBalance(null);
    setCreditDialog({ open: true, user });
    setLoadingCreditBalance(true);
    // Fetch the latest balance from the profiles table directly
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", user.user_id)
      .single();
    setCreditUserBalance(data ? Number(data.balance) : 0);
    setLoadingCreditBalance(false);
  };

  const handleCreditWallet = async () => {
    if (!creditDialog.user || !creditAmount || isNaN(Number(creditAmount)) || Number(creditAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setCreditSubmitting(true);
    const amountNum = Number(creditAmount);
    const description = creditNote.trim() || "💳 Admin Wallet Credit";

    // Insert a completed deposit transaction — the DB trigger will update profiles.balance
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: creditDialog.user.user_id,
      type: "deposit",
      amount: amountNum,
      currency: "USD",
      status: "completed",
      description,
      reference: `admin-credit-${Date.now()}`,
    });

    if (txError) {
      toast.error(txError.message);
      setCreditSubmitting(false);
      return;
    }

    // Also directly update balance in case trigger is not yet applied
    await supabase
      .from("profiles")
      .update({ balance: (creditUserBalance ?? 0) + amountNum })
      .eq("user_id", creditDialog.user.user_id);

    // Send in-app notification to the user
    await supabase.from("notifications").insert({
      user_id: creditDialog.user.user_id,
      title: "💳 Wallet Credited",
      message: `$${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been credited to your wallet.${creditNote.trim() ? ` Note: ${creditNote.trim()}` : ""
        }`,
      type: "success",
    });

    toast.success(
      `$${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} credited to ${creditDialog.user.display_name || creditDialog.user.email
      }`
    );
    setCreditDialog({ open: false, user: null });
    fetchUsers();
    setCreditSubmitting(false);
  };

  const toggleRole = async (userId: string, role: "admin" | "moderator" | "user" | "enterprise") => {
    const userRoles = roles[userId] || [];
    if (userRoles.includes(role)) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) toast.error(error.message);
      else toast.success(`Removed ${role} role`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) toast.error(error.message);
      else toast.success(`Added ${role} role`);
    }
    fetchUsers();
  };

  const handleStatusAction = async () => {
    if (!actionDialog.user) return;
    setActionLoading(true);

    const newStatus = actionDialog.action === "activate" ? "active" : actionDialog.action;
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus, admin_notes: adminNotes || null })
      .eq("user_id", actionDialog.user.user_id);

    if (error) {
      toast.error(error.message);
    } else {
      // Notify user
      await supabase.from("notifications").insert({
        user_id: actionDialog.user.user_id,
        title: newStatus === "active" ? "Account Reactivated" : `Account ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: newStatus === "active"
          ? "Your account has been reactivated. You can now access all features."
          : `Your account has been ${newStatus}. ${adminNotes ? `Reason: ${adminNotes}` : "Please contact support for more information."}`,
        type: newStatus === "active" ? "success" : "error",
      });
      toast.success(`User ${newStatus === "active" ? "activated" : newStatus}`);
    }

    setActionLoading(false);
    setActionDialog({ open: false, user: null, action: "" });
    setAdminNotes("");
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchesSearch = !search ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || (u.status || "active") === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "suspended": return "bg-amber-400/10 text-amber-400";
      case "banned": return "bg-destructive/10 text-destructive";
      default: return "bg-accent-dim text-primary";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-1">User Management</h1>
            <p className="font-body text-sm text-muted-foreground">
              {users.length} total · {users.filter((u) => (u.status || "active") === "active").length} active · {users.filter((u) => u.status === "suspended").length} suspended
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 bg-input border-border text-foreground" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${statusFilter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-body text-xs text-muted-foreground p-4">User</th>
                  <th className="text-left font-body text-xs text-muted-foreground p-4 hidden md:table-cell">Email</th>
                  <th className="text-left font-body text-xs text-muted-foreground p-4">Status</th>
                  <th className="text-left font-body text-xs text-muted-foreground p-4 hidden lg:table-cell">Roles</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4 hidden sm:table-cell">Joined</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const userRoles = roles[u.user_id] || ["user"];
                  const status = u.status || "active";
                  return (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-card-hover transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${status !== "active" ? "bg-destructive/20" : "bg-primary/20"}`}>
                            <span className={`font-heading font-bold text-sm ${status !== "active" ? "text-destructive" : "text-primary"}`}>
                              {(u.display_name || u.email || "U")[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-body text-sm text-foreground font-medium">{u.display_name || "Unnamed"}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="p-4">
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-pill capitalize ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {userRoles.map((r) => (
                            <span
                              key={r}
                              className={`font-mono text-[10px] px-2 py-0.5 rounded-pill capitalize ${r === "admin"
                                ? "bg-destructive/10 text-destructive"
                                : r === "enterprise"
                                  ? "bg-amber-400/10 text-amber-400"
                                  : "bg-accent-dim text-primary"
                                }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => { setDetailUser(u); setDetailOpen(true); }} className="gap-2 text-sm">
                              <Eye size={14} /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCreditDialog(u)} className="gap-2 text-sm text-emerald-400">
                              <Wallet size={14} /> Credit Wallet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => loginAsUser(u)} className="gap-2 text-sm text-blue-400">
                              <LogIn size={14} /> Login as User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleRole(u.user_id, "admin")} className="gap-2 text-sm">
                              <Shield size={14} />
                              {userRoles.includes("admin") ? "Remove Admin" : "Make Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleRole(u.user_id, "enterprise")} className="gap-2 text-sm">
                              <CheckCircle size={14} />
                              {userRoles.includes("enterprise") ? "Remove Enterprise" : "Make Enterprise"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {status === "active" ? (
                              <>
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, user: u, action: "suspended" })} className="gap-2 text-sm text-amber-400">
                                  <UserX size={14} /> Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, user: u, action: "banned" })} className="gap-2 text-sm text-destructive">
                                  <Ban size={14} /> Ban User
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => setActionDialog({ open: true, user: u, action: "activate" })} className="gap-2 text-sm text-primary">
                                <UserCheck size={14} /> Reactivate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center font-body text-sm text-muted-foreground">No users found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">User Details</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-heading font-bold text-xl">
                    {(detailUser.display_name || "U")[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-heading font-bold text-lg text-foreground">{detailUser.display_name || "Unnamed"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{detailUser.email}</p>
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="font-body text-xs text-muted-foreground">Status</p>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${getStatusBadge(detailUser.status || "active")}`}>
                    {detailUser.status || "active"}
                  </span>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Country</p>
                  <p className="font-body text-sm text-foreground">{detailUser.country || "Not set"}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Phone</p>
                  <p className="font-body text-sm text-foreground">{detailUser.phone || "Not set"}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Joined</p>
                  <p className="font-mono text-xs text-foreground">
                    {new Date(detailUser.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-body text-xs text-muted-foreground">Roles</p>
                  <div className="flex gap-1 mt-1">
                    {(roles[detailUser.user_id] || ["user"]).map((r) => (
                      <span key={r} className="font-mono text-[10px] px-2 py-0.5 rounded-pill capitalize bg-accent-dim text-primary">{r}</span>
                    ))}
                  </div>
                </div>
                {detailUser.admin_notes && (
                  <div className="col-span-2">
                    <p className="font-body text-xs text-muted-foreground">Admin Notes</p>
                    <p className="font-body text-sm text-foreground mt-1">{detailUser.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend/Ban Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(o) => { if (!o) setActionDialog({ open: false, user: null, action: "" }); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              {actionDialog.action === "activate" ? "Reactivate" : actionDialog.action === "suspended" ? "Suspend" : "Ban"} User
            </DialogTitle>
          </DialogHeader>
          {actionDialog.user && (
            <div className="space-y-4">
              <p className="font-body text-sm text-muted-foreground">
                {actionDialog.action === "activate"
                  ? `Are you sure you want to reactivate ${actionDialog.user.display_name || actionDialog.user.email}?`
                  : `Are you sure you want to ${actionDialog.action === "suspended" ? "suspend" : "ban"} ${actionDialog.user.display_name || actionDialog.user.email}? They will not be able to access their account.`}
              </p>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  {actionDialog.action === "activate" ? "Notes (optional)" : "Reason"}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionDialog.action === "activate" ? "Optional notes..." : "Provide a reason..."}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, user: null, action: "" })}>Cancel</Button>
            <Button
              onClick={handleStatusAction}
              disabled={actionLoading}
              className={actionDialog.action === "activate" ? "" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
            >
              {actionLoading ? "Processing..." : actionDialog.action === "activate" ? "Reactivate" : actionDialog.action === "suspended" ? "Suspend" : "Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Wallet Dialog */}
      <AnimatePresence>
        {creditDialog.open && creditDialog.user && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => { if (!creditSubmitting) setCreditDialog({ open: false, user: null }); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
            >
              <div className="bg-card border border-emerald-500/20 rounded-xl p-6 shadow-2xl shadow-black/40">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20">
                    <Wallet size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-foreground">Credit Wallet</h2>
                    <p className="font-body text-xs text-muted-foreground">
                      For: <span className="text-foreground font-medium">{creditDialog.user.display_name || creditDialog.user.email}</span>
                    </p>
                  </div>
                </div>

                {/* Current balance */}
                <div className="bg-secondary border border-border rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Current Balance</p>
                    <p className="font-body text-xs text-muted-foreground/60 mt-0.5">Before credit</p>
                  </div>
                  {loadingCreditBalance ? (
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  ) : (
                    <p className="font-mono text-xl font-bold text-foreground">
                      ${(creditUserBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                {/* Info banner */}
                <div className="p-3 rounded-lg mb-5 text-xs font-body bg-emerald-400/5 border border-emerald-400/20 text-emerald-400">
                  💳 The amount will be credited instantly as a completed deposit and the user will be notified.
                </div>

                {/* Amount input */}
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1.5 block">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                        <DollarSign size={14} />
                      </span>
                      <input
                        id="credit-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        autoFocus
                        className="w-full h-10 pl-9 pr-3 rounded-md bg-input border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/40 transition-all"
                      />
                    </div>
                    {creditAmount && !isNaN(Number(creditAmount)) && Number(creditAmount) > 0 && (
                      <p className="font-body text-xs text-emerald-400 mt-1">
                        New balance: ${((creditUserBalance ?? 0) + Number(creditAmount)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1.5 block">Note (optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Promotional credit, manual adjustment..."
                      value={creditNote}
                      onChange={(e) => setCreditNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-input border border-border text-foreground font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/40 transition-all"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setCreditDialog({ open: false, user: null })}
                    disabled={creditSubmitting}
                    className="flex-1 h-10 rounded-lg border border-border text-foreground font-body text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreditWallet}
                    disabled={creditSubmitting || !creditAmount || Number(creditAmount) <= 0}
                    className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-body text-sm font-medium gap-2 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {creditSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wallet size={14} />
                    )}
                    {creditSubmitting ? "Crediting..." : `Credit $${Number(creditAmount) > 0 ? Number(creditAmount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminUsers;
