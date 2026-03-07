import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success("You're subscribed! Watch your inbox.");
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="px-6 lg:px-12 py-24 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl mx-auto text-center"
      >
        <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">Newsletter</span>
        <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">STAY AHEAD OF THE MARKET</h2>
        <p className="font-body text-muted-foreground mb-8 max-w-md mx-auto">
          Get weekly market insights, investment tips, and platform updates delivered straight to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground flex-1"
            required
          />
          <Button variant="hero" type="submit" className="px-6">
            {submitted ? <CheckCircle size={16} /> : <>Subscribe <ArrowUpRight size={14} /></>}
          </Button>
        </form>

        <p className="font-body text-xs text-muted-foreground mt-4">
          No spam. Unsubscribe anytime. 50,000+ subscribers.
        </p>
      </motion.div>
    </section>
  );
};

export default NewsletterSection;
