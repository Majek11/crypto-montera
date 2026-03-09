import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const testimonials = [
    { name: t("testimonials.t1Name"), role: t("testimonials.t1Role"), text: t("testimonials.t1Text"), avatar: "SC" },
    { name: t("testimonials.t2Name"), role: t("testimonials.t2Role"), text: t("testimonials.t2Text"), avatar: "JR" },
    { name: t("testimonials.t3Name"), role: t("testimonials.t3Role"), text: t("testimonials.t3Text"), avatar: "EW" },
    { name: t("testimonials.t4Name"), role: t("testimonials.t4Role"), text: t("testimonials.t4Text"), avatar: "MO" },
    { name: t("testimonials.t5Name"), role: t("testimonials.t5Role"), text: t("testimonials.t5Text"), avatar: "LP" },
    { name: t("testimonials.t6Name"), role: t("testimonials.t6Role"), text: t("testimonials.t6Text"), avatar: "DM" },
  ];
  return (
    <section className="px-6 lg:px-12 py-24 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">{t("testimonials.label")}</span>
          <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">{t("testimonials.title")}</h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={item}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-lg p-6 hover:border-border-light transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="text-primary fill-primary" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-dim flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">{t.avatar}</span>
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-foreground">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
