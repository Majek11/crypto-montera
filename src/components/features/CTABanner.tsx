import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTABanner = () => {
  return (
    <section className="px-6 lg:px-12 py-24 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">
          START INVESTING IN 60 SECONDS
        </h2>
        <p className="font-body text-muted-foreground mb-8 max-w-md mx-auto">
          Create your account today and unlock institutional-grade crypto investment plans with zero fees.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/signup">
            <Button variant="hero" size="lg" className="text-base px-10 py-6">
              Create Account <ArrowUpRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="hero-ghost" size="lg" className="text-base px-10 py-6">
              Sign In
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default CTABanner;
