import React from "react";
import { motion } from "motion/react";
import { Map, BrainCircuit, Timer, Trophy, ArrowRight, Play } from "lucide-react";
import { GameMode } from "../../types";
import { cn } from "../../lib/utils";

interface LandingViewProps {
  onStart: (mode: GameMode) => void;
  unlockedCount: number;
  lang: "ar" | "en";
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart, unlockedCount, lang }) => {
  const isAr = lang === "ar";
  
  const t = {
    subtitle: isAr ? "نظام اكتشاف التراث الرقمي" : "SYSTEM_MANIFEST / MOROCCO",
    title: isAr ? (
      <>كشف <span className="text-accent-gold font-medium italic">الروح التاريخية</span></>
    ) : (
      <>The Historical <br /> <span className="text-accent-gold font-medium italic">Soul of Morocco</span></>
    ),
    desc: isAr 
      ? "محاكاة تفاعلية عالية الدقة للاستكشاف الأكاديمي للمعالم المغربية. اختبر العجائب المعمارية من خلال تصور جغرافي مكاني متقدم."
      : "A high-fidelity simulation designed for the academic exploration of heritage. Access architectural datasets through advanced geospatial visualization units.",
    exploration: {
      title: isAr ? "الاستكشاف الميداني" : "Field Exploration",
      desc: isAr ? "نقل الخريطة التفاعلية. اكتشف تاريخ المعالم والأسرار المعمارية." : "Active geospatial mapping of 350+ data points including restricted architectural archives.",
      stats: isAr ? `${unlockedCount} / 12 معلم` : `${unlockedCount} ARCHIVED`,
      type: isAr ? "خريطة النظام" : "TACTICAL_MAP",
      cta: isAr ? "استكشاف الخريطة" : "Initialize Map Scan"
    },
    quiz: {
      title: isAr ? "اختبار تاريخي" : "Historical Evaluation",
      desc: isAr ? "اختبر معرفتك بالمدن والمعالم المغربية. حقق كفاءة عالية." : "Testing cognitive retention of historical datasets through multiple levels of proficiency.",
      stats: isAr ? "اختيار من متعدد" : "MULTI_PROCESS",
      type: isAr ? "محرك التحليل" : "KNOWLEDGE_INDEX",
      cta: isAr ? "بدء الاختبار" : "Start Protocol"
    },
    defi: {
      title: isAr ? "التحدي التشغيلي" : "Operational Challenge",
      desc: isAr ? "تحدي عالي المخاطر للسرعة والدقة. حدد الأهداف قبل انتهاء الوقت." : "Time-sensitive target identification protocol for rapid heritage survey operations.",
      stats: isAr ? "أهداف زمنية" : "TIME_CRITICAL",
      type: isAr ? "وحدة التحدي" : "RESPONSE_UNIT",
      cta: isAr ? "بدء التحدي" : "Engage Unit"
    }
  };

  return (
    <div className="flex-1 w-full bg-bg-deep overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-24">
        {/* Hero Section: Retaining the refactored hierarchy (the "first text") */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20 md:mb-32"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-accent-gold uppercase">
              {t.subtitle}
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-medium text-white mb-8 leading-[0.9] tracking-tighter">
            {t.title}
          </h1>
          <p className="text-text-muted text-lg leading-relaxed max-w-2xl font-light mb-0 opacity-80">
            {t.desc}
          </p>
        </motion.div>

        {/* Mode Selection Grid: Symmetric Layout as per requested "previous version" cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ModeCard 
              icon={<Map size={32} />}
              title={t.exploration.title}
              desc={t.exploration.desc}
              stats={t.exploration.stats}
              onClick={() => onStart("exploration")}
              color="amber"
              type={t.exploration.type}
              lang={lang}
            />
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ModeCard 
              icon={<BrainCircuit size={32} />}
              title={t.quiz.title}
              desc={t.quiz.desc}
              stats={t.quiz.stats}
              onClick={() => onStart("quiz")}
              color="emerald"
              type={t.quiz.type}
              lang={lang}
            />
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <ModeCard 
              icon={<Timer size={32} />}
              title={t.defi.title}
              desc={t.defi.desc}
              stats={t.defi.stats}
              onClick={() => onStart("defi")}
              color="orange"
              type={t.defi.type}
              lang={lang}
            />
          </motion.div>
        </div>

        {/* System Details Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 pt-12 border-t border-white/5 flex flex-wrap justify-between items-end gap-12"
        >
          <div className="flex gap-16">
            <div className="flex flex-col gap-1">
              <span className="tech-label">Build Variant</span>
              <span className="text-xs font-mono text-text-main opacity-60">PROD_2.1.0_REL</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="tech-label">Geosync Status</span>
              <span className="text-xs font-mono text-text-main opacity-60">STABLE_31.7°N</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 grayscale opacity-30 brightness-200">
            <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase">Authorized Access Only</span>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-8 h-1 bg-text-muted/20" />)}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  stats: string;
  onClick: () => void;
  color: "amber" | "emerald" | "orange";
  type: string;
  lang: "ar" | "en";
}

const ModeCard = ({ icon, title, desc, stats, onClick, color, type, lang }: ModeCardProps) => {
  const isAr = lang === "ar";
  const colorMap = {
    amber: "from-accent-gold/20 to-accent-gold/40 text-accent-gold border-accent-gold/20 bg-accent-gold/5",
    emerald: "from-accent-gold/20 to-accent-gold/40 text-accent-gold border-accent-gold/20 bg-accent-gold/5",
    orange: "from-accent-gold/20 to-accent-gold/40 text-accent-gold border-accent-gold/20 bg-accent-gold/5",
  };

  return (
    <motion.button 
      whileHover={{ y: -10, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "group relative text-left h-full border p-1 rounded-[32px] overflow-hidden transition-all duration-500 hover-shine",
        colorMap[color],
        isAr && "text-right"
      )}
    >
      <div className="bg-bg-surface h-full w-full rounded-[31px] p-10 flex flex-col items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full translate-x-16 translate-y-[-40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-accent-gold" />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-current/10 border border-current/20 transition-transform group-hover:rotate-6">
          {icon}
        </div>
        
        <div className="mb-2 w-full">
          <span className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase font-mono">{type}</span>
          <h3 className="text-2xl font-display font-medium text-text-main tracking-tight mt-1 group-hover:text-accent-gold transition-colors uppercase">
            {title}
          </h3>
        </div>

        <p className="text-text-muted text-sm leading-relaxed font-light mb-12">
          {desc}
        </p>

        <div className="mt-auto flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest opacity-20 uppercase font-mono">{isAr ? "بيانات القياس" : "Telemetry Data"}</span>
            <span className="text-xs font-mono text-text-main/50">{stats}</span>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-full border border-border flex items-center justify-center text-text-main/20 group-hover:text-accent-gold group-hover:border-accent-gold transition-all",
            isAr && "rotate-180"
          )}>
            <Play size={20} className={cn(!isAr && "ml-1")} />
          </div>
        </div>
      </div>
    </motion.button>
  );
};
