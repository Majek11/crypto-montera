import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import coinEthereum from "@/assets/coin-ethereum.png";
import coinBinance from "@/assets/coin-binance.png";
import coinTether from "@/assets/coin-tether.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-6 lg:px-12">
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsla(130,100%,65%,0.04), transparent 70%)" }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-mono text-xs text-primary tracking-wider">LIVE</span>
          <span className="font-mono text-xs text-muted-foreground">· Market open</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground mb-6"
        >
          INVEST IN CRYPTO<br />
          WITH <span className="text-primary">CONFIDENCE</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="font-body text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
        >
          Zero fees. Instant settlement. Bank-grade security.
          <br className="hidden sm:block" />
          A platform built for investors who demand more.
        </motion.p>

        {/* Floating crypto icons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          {[
            { src: coinEthereum, alt: "Ethereum", delay: 0 },
            { src: coinBinance, alt: "Binance", delay: 0.15 },
            { src: coinTether, alt: "Tether", delay: 0.3 },
          ].map((coin) => (
            <motion.img
              key={coin.alt}
              src={coin.src}
              alt={coin.alt}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-border shadow-lg -ml-2 first:ml-0"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: coin.delay, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Link to="/signup">
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Get Started <ArrowUpRight size={16} />
            </Button>
          </Link>
          <Link to="/#plans">
            <Button variant="hero-ghost" size="lg" className="text-base px-8 py-6">
              View Plans
            </Button>
          </Link>
        </motion.div>

        {/* Minimal stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex justify-center gap-10 mt-16"
        >
          {[
            { value: "$4.2B+", label: "Assets Managed", icon: TrendingUp },
            { value: "2.1M+", label: "Active Users", icon: Zap },
            { value: "500+", label: "Trading Pairs", icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-mono text-lg text-foreground font-medium leading-tight">{stat.value}</p>
                <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
