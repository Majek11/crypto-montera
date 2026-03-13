import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

const investmentFeed = [
    { name: "James K.", location: "Lagos, NG", amount: 5200, plan: "Growth Plan", risk: "moderate", avatar: "JK" },
    { name: "Sarah M.", location: "Accra, GH", amount: 12000, plan: "Alpha Plan", risk: "aggressive", avatar: "SM" },
    { name: "Emmanuel O.", location: "Nairobi, KE", amount: 800, plan: "Starter Plan", risk: "conservative", avatar: "EO" },
    { name: "Fatima A.", location: "Dubai, AE", amount: 25000, plan: "Conservative Plan", risk: "conservative", avatar: "FA" },
    { name: "David N.", location: "London, UK", amount: 3500, plan: "Growth Plan", risk: "moderate", avatar: "DN" },
    { name: "Amara S.", location: "Toronto, CA", amount: 7800, plan: "Alpha Plan", risk: "aggressive", avatar: "AS" },
    { name: "Kwame B.", location: "Kumasi, GH", amount: 1200, plan: "Starter Plan", risk: "conservative", avatar: "KB" },
    { name: "Priya R.", location: "Singapore, SG", amount: 15000, plan: "Conservative Plan", risk: "conservative", avatar: "PR" },
    { name: "Michael T.", location: "New York, US", amount: 50000, plan: "Alpha Plan", risk: "aggressive", avatar: "MT" },
    { name: "Aisha M.", location: "Lagos, NG", amount: 2000, plan: "Growth Plan", risk: "moderate", avatar: "AM" },
    { name: "Carlos V.", location: "São Paulo, BR", amount: 9500, plan: "Conservative Plan", risk: "conservative", avatar: "CV" },
    { name: "Zara H.", location: "Manchester, UK", amount: 4200, plan: "Growth Plan", risk: "moderate", avatar: "ZH" },
    { name: "Ahmed I.", location: "Cairo, EG", amount: 6800, plan: "Alpha Plan", risk: "aggressive", avatar: "AI" },
    { name: "Ngozi P.", location: "Abuja, NG", amount: 3000, plan: "Growth Plan", risk: "moderate", avatar: "NP" },
    { name: "Liu W.", location: "Hong Kong, HK", amount: 20000, plan: "Alpha Plan", risk: "aggressive", avatar: "LW" },
];

const riskColors: Record<string, string> = {
    conservative: "text-blue-400 bg-blue-400/10",
    moderate: "text-primary bg-accent-dim",
    aggressive: "text-amber-400 bg-amber-400/10",
};

const avatarColors = [
    "bg-primary/20 text-primary",
    "bg-blue-400/20 text-blue-400",
    "bg-amber-400/20 text-amber-400",
    "bg-purple-400/20 text-purple-400",
    "bg-pink-400/20 text-pink-400",
];

const formatAmount = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

const timeAgo = (index: number) => {
    const ts = [
        "just now", "1 min ago", "2 mins ago", "3 mins ago", "4 mins ago",
        "5 mins ago", "7 mins ago", "9 mins ago", "11 mins ago", "14 mins ago",
        "17 mins ago", "21 mins ago", "25 mins ago", "30 mins ago", "38 mins ago",
    ];
    return ts[index % ts.length];
};

const LiveActivitySection = () => {
    const [visibleItems, setVisibleItems] = useState(investmentFeed.slice(0, 7));
    const [pointer, setPointer] = useState(7);

    // Every 4s, remove oldest and add next item to simulate live feed  
    useEffect(() => {
        const interval = setInterval(() => {
            setPointer((p) => {
                const next = (p + 1) % investmentFeed.length;
                setVisibleItems((prev) => [
                    investmentFeed[next],
                    ...prev.slice(0, 6),
                ]);
                return next;
            });
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        { label: "Active Investors", value: "14,820+", icon: Users, color: "text-primary" },
        { label: "Total Invested", value: "$4.2B+", icon: DollarSign, color: "text-primary" },
        { label: "Avg. Monthly ROI", value: "8.4%", icon: TrendingUp, color: "text-primary" },
        { label: "Investments Today", value: "1,243", icon: Activity, color: "text-primary" },
    ];

    return (
        <section className="py-20 px-4 bg-background relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse at 50% 0%, hsla(130,100%,65%,0.04), transparent 70%)"
            }} />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 bg-accent-dim border border-primary/20 rounded-pill px-4 py-1.5 mb-4">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-mono text-xs text-primary font-medium tracking-wide">LIVE ACTIVITY</span>
                    </div>
                    <h2 className="font-heading font-black text-3xl md:text-3xl text-foreground mb-3">
                        INVESTORS ARE JOINING<br />
                        <span className="text-primary">RIGHT NOW</span>
                    </h2>
                    <p className="font-body text-muted-foreground max-w-md mx-auto">
                        Thousands of investors across the globe are growing their wealth with Montera every day.
                    </p>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.05 * i }}
                            className="bg-card border border-border rounded-xl p-5 text-center"
                        >
                            <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
                            <p className={`font-mono text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
                            <p className="font-body text-xs text-muted-foreground">{s.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Live feed */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Feed column */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="font-body text-sm font-medium text-foreground">Recent Investments</span>
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">Updates every few seconds</span>
                        </div>
                        <div className="space-y-2 relative">
                            {visibleItems.map((item, i) => (
                                <motion.div
                                    key={`${item.name}-${i}-${pointer}`}
                                    initial={i === 0 ? { opacity: 0, x: -10, height: 0 } : { opacity: 1 }}
                                    animate={{ opacity: 1, x: 0, height: "auto" }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className={`flex items-center gap-3 bg-card border rounded-xl px-4 py-3 ${i === 0 ? "border-primary/30" : "border-border"}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                                        {item.avatar}
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-body text-sm font-medium text-foreground">{item.name}</span>
                                            <span className="font-body text-xs text-muted-foreground truncate hidden sm:block">{item.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-pill capitalize ${riskColors[item.risk]}`}>
                                                {item.plan}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Amount + time */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-mono text-sm font-bold text-primary">{formatAmount(item.amount)}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{timeAgo(i)}</p>
                                    </div>
                                    {i === 0 && (
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right column — breakdown */}
                    <div className="space-y-4">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h4 className="font-heading font-bold text-base text-foreground mb-4">Plan Popularity</h4>
                            {[
                                { plan: "Alpha Plan", pct: 38, color: "bg-amber-400" },
                                { plan: "Growth Plan", pct: 32, color: "bg-primary" },
                                { plan: "Conservative Plan", pct: 20, color: "bg-blue-400" },
                                { plan: "Starter Plan", pct: 10, color: "bg-purple-400" },
                            ].map((p) => (
                                <div key={p.plan} className="mb-3 last:mb-0">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-body text-xs text-muted-foreground">{p.plan}</span>
                                        <span className="font-mono text-xs text-foreground">{p.pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${p.pct}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                            className={`h-full rounded-full ${p.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6">
                            <h4 className="font-heading font-bold text-base text-foreground mb-4">Top Investor Countries</h4>
                            {[
                                { country: "🇬🇧 United Kingdom", value: "48%" },
                                { country: "🇺🇸 United States", value: "60%" },
                                { country: "🇮🇷 Iran", value: "58%" },
                                { country: "🇮🇳 India", value: "28%" },
                                { country: "🇸🇦 Dubai", value: "28%" },
                                { country: "🇮🇩 Indonesia", value: "28%" },
                                { country: "🌍 Others", value: "26%" },
                            ].map((c) => (
                                <div key={c.country} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                                    <span className="font-body text-sm text-foreground">{c.country}</span>
                                    <span className="font-mono text-sm text-primary font-bold">{c.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LiveActivitySection;
