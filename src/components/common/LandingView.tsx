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
    subtitle: isAr ? "نظام اكتشاف التراث الرقمي" : "Digital Heritage Discovery System",
    title: isAr ? (
      <>كشف <span className="text-accent-gold font-normal italic">الروح التاريخية</span> للمغرب</>
    ) : (
      <>Unveil the <br /> <span className="text-accent-gold font-normal italic">Historical Soul</span> of Morocco</>
    ),
    desc: isAr 
      ? "محاكاة تفاعلية عالية الدقة للاستكشاف الأكاديمي للمعالم المغربية. اختبر العجائب المعمارية من خلال تصور جغرافي مكاني متقدم."
      : "A high-fidelity interactive simulation for the academic exploration of Moroccan monuments. Experience the architectural marvels through advanced geospatial visualization.",
    exploration: {
      title: isAr ? "الاستكشاف" : "EXPLORATION",
      desc: isAr ? "نقل الخريطة التفاعلية. اكتشف تاريخ المعالم والأسرار المعمارية." : "Navigate the interactive map. Discover monument history and architectural secrets.",
      stats: isAr ? `${unlockedCount} / 12 معلم` : `${unlockedCount} / 12 MONUMENTS`,
      type: isAr ? "خريطة النظام" : "SYSTEM MAP"
    },
    quiz: {
      title: isAr ? "اختبار تاريخي" : "HISTORICAL QUIZ",
      desc: isAr ? "اختبر معرفتك بالمدن والمعالم المغربية. حقق كفاءة عالية." : "Test your knowledge of Moroccan cities and monuments. Achieve high proficiency.",
      stats: isAr ? "اختيار من متعدد" : "MULTIPLE CHOICE",
      type: isAr ? "محرك التحليل" : "ANALYSIS ENGINE"
    },
    defi: {
      title: isAr ? "التحدي التشغيلي" : "DEFI OPERATIONAL",
      desc: isAr ? "تحدي عالي المخاطر للسرعة والدقة. حدد الأهداف قبل انتهاء الوقت." : "A high-stakes challenge of speed and accuracy. Identify targets before time expires.",
      stats: isAr ? "أهداف زمنية" : "TIMED OBJECTIVES",
      type: isAr ? "وحدة التحدي" : "CHALLENGE UNIT"
    },
    version: isAr ? "إصدار النظام" : "System version",
    access: isAr ? "الوصول الإقليمي" : "Regional Access"
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-20 px-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-gold/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-4xl z-10"
      >
        <span className="text-[10px] font-black tracking-[0.8em] text-accent-gold uppercase mb-8 ml-[0.8em] animate-pulse">
          {t.subtitle}
        </span>
        <h1 className="text-7xl md:text-8xl font-serif font-light text-text-main mb-10 leading-[1.1] tracking-tighter">
          {t.title}
        </h1>
        <p className="text-text-muted text-lg leading-relaxed max-w-2xl font-light mb-16 opacity-80">
          {t.desc}
        </p>
      </motion.div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10">
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

      {/* Footer Stats */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 flex gap-20 border-t border-white/5 pt-10"
      >
        <div className="flex flex-col">
          <span className="text-[10px] text-stone-500 font-black tracking-widest uppercase">{t.version}</span>
          <span className="text-xl font-mono text-white">v2.1.0-ACADEMIC</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-stone-500 font-black tracking-widest uppercase">{t.access}</span>
          <span className="text-xl font-mono text-white">MOROCCO-NORTH_AFRICA</span>
        </div>
      </motion.div>
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
        lang === "ar" && "text-right"
      )}
    >
      <div className="bg-bg-surface h-full w-full rounded-[31px] p-10 flex flex-col items-start relative overflow-hidden">
        {/* Background glow hover effect */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full translate-x-16 translate-y-[-40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-accent-gold",
        )} />

        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-current/10 border border-current/20 transition-transform group-hover:rotate-6",
        )}>
          {icon}
        </div>
        
        <div className="mb-2">
          <span className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase font-mono">{type}</span>
          <h3 className="text-2xl font-serif text-text-main tracking-tight mt-1 group-hover:text-accent-gold transition-colors uppercase">
            {title}
          </h3>
        </div>

        <p className="text-text-muted text-sm leading-relaxed font-light mb-12">
          {desc}
        </p>

        <div className="mt-auto flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest opacity-20 uppercase font-mono">{lang === "ar" ? "بيانات القياس" : "Telemetry Data"}</span>
            <span className="text-xs font-mono text-text-main/50">{stats}</span>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-full border border-border flex items-center justify-center text-text-main/20 group-hover:text-accent-gold group-hover:border-accent-gold transition-all",
            lang === "ar" ? "rotate-180" : ""
          )}>
            <Play size={20} className="ml-1" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};
