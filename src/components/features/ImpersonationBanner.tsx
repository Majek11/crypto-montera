import { motion, AnimatePresence } from "framer-motion";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut, User } from "lucide-react";

/**
 * ImpersonationBanner
 *
 * A fixed, persistent top-of-screen banner shown whenever an admin
 * is viewing the dashboard as another user. It cannot be dismissed
 * without clicking "Exit" — which clears the impersonation state and
 * returns the admin to the user management page.
 */
const ImpersonationBanner = () => {
    const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonation();
    const navigate = useNavigate();

    const handleExit = () => {
        stopImpersonation();
        navigate("/admin/users");
    };

    return (
        <AnimatePresence>
            {isImpersonating && impersonatedUser && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-sm border-b border-amber-400/50 shadow-lg shadow-amber-900/20"
                >
                    <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0">
                            <ShieldAlert size={13} className="text-amber-100" />
                        </div>

                        {/* Message */}
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <span className="font-body text-xs font-semibold text-amber-950">
                                Admin View Mode
                            </span>
                            <span className="hidden sm:inline text-amber-900 text-xs">·</span>
                            <span className="font-body text-xs text-amber-900 flex items-center gap-1.5">
                                <User size={11} />
                                Viewing as{" "}
                                <strong className="font-semibold text-amber-950">
                                    {impersonatedUser.display_name || impersonatedUser.email}
                                </strong>
                                <span className="font-mono text-[10px] text-amber-800 hidden sm:inline">
                                    ({impersonatedUser.email})
                                </span>
                            </span>
                            <span className="hidden md:inline font-body text-[11px] text-amber-800 bg-amber-900/20 px-2 py-0.5 rounded-full">
                                Read-only · Actions are performed with your admin session
                            </span>
                        </div>

                        {/* Exit button */}
                        <button
                            onClick={handleExit}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/20 hover:bg-amber-950/35 border border-amber-900/30 font-body text-xs font-semibold text-amber-950 transition-colors"
                        >
                            <LogOut size={12} />
                            Exit
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImpersonationBanner;
