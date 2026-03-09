import { motion } from "framer-motion";
import { Shield, TrendingUp, Users, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const AboutSection = () => {
  const { t } = useTranslation();
  const values = [
    { icon: Shield, title: t("aboutSection.securityFirst"), desc: t("aboutSection.securityFirstDesc") },
    { icon: TrendingUp, title: t("aboutSection.smartGrowth"), desc: t("aboutSection.smartGrowthDesc") },
    { icon: Users, title: t("aboutSection.communityDriven"), desc: t("aboutSection.communityDrivenDesc") },
    { icon: Clock, title: t("aboutSection.support247"), desc: t("aboutSection.support247Desc") },
  ];
  return (
    <section id="about" className="px-6 lg:px-12 py-24 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block"
            >
              {t("aboutSection.label")}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-display text-5xl sm:text-6xl text-foreground mb-6 leading-[0.95]"
            >
              {t("aboutSection.title1")}<br />{t("aboutSection.title2")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="font-body text-muted-foreground mb-6 leading-relaxed"
            >
              {t("aboutSection.desc1")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="font-body text-muted-foreground leading-relaxed"
            >
              {t("aboutSection.desc2")}
            </motion.p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {values.map((v) => (
              <motion.div
                key={v.title}
                variants={item}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card border border-border rounded-lg p-5 hover:border-border-light transition-all"
              >
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center mb-3"
                >
                  <v.icon size={18} className="text-primary" />
                </motion.div>
                <h3 className="font-heading font-bold text-sm text-foreground mb-1">{v.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
