import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success(t("newsletter.subscribed"));
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
        <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">{t("newsletter.label")}</span>
        <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">{t("newsletter.title")}</h2>
        <p className="font-body text-muted-foreground mb-8 max-w-md mx-auto">
          {t("newsletter.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground flex-1"
            required
          />
          <Button variant="hero" type="submit" className="px-6">
            {submitted ? <CheckCircle size={16} /> : <>{t("newsletter.subscribe")} <ArrowUpRight size={14} /></>}
          </Button>
        </form>

        <p className="font-body text-xs text-muted-foreground mt-4">
          {t("newsletter.disclaimer")}
        </p>
      </motion.div>
    </section>
  );
};

export default NewsletterSection;
