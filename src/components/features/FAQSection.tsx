import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const FAQSection = () => {
  const { t } = useTranslation();
  const faqs = [
    { q: t("faqSection.q1"), a: t("faqSection.a1") },
    { q: t("faqSection.q2"), a: t("faqSection.a2") },
    { q: t("faqSection.q3"), a: t("faqSection.a3") },
    { q: t("faqSection.q4"), a: t("faqSection.a4") },
    { q: t("faqSection.q5"), a: t("faqSection.a5") },
    { q: t("faqSection.q6"), a: t("faqSection.a6") },
    { q: t("faqSection.q7"), a: t("faqSection.a7") },
    { q: t("faqSection.q8"), a: t("faqSection.a8") },
  ];
  return (
    <section id="faq" className="px-6 lg:px-12 py-24 bg-surface">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">{t("faqSection.label")}</span>
          <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">{t("faqSection.title")}</h2>
          <p className="font-body text-muted-foreground">
            {t("faqSection.subtitle")}
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-3">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={item}>
                <AccordionItem
                  value={`item-${i}`}
                  className="bg-card border border-border rounded-lg px-6 data-[state=open]:border-border-light transition-all"
                >
                  <AccordionTrigger className="font-heading font-bold text-sm text-foreground hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </motion.div>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
