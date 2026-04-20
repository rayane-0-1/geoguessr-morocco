import React, { useState, useEffect } from "react";
import { Monument, City } from "../../types";
import { MapComponent } from "./MapComponent.tsx";
import { MonumentModal } from "./MonumentModal.tsx";
import { TutorialOverlay } from "./TutorialOverlay.tsx";
import { AnimatePresence, motion } from "motion/react";
import { audioService } from "../../services/audioService";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "../../lib/utils";

interface ExplorationModeProps {
  monuments: Monument[];
  cities: City[];
  onExplored: (id: string, score: number) => void;
  unlockedList: string[];
  externalTarget?: Monument | City | null;
  lang: "ar" | "en";
  userLocation: [number, number] | null;
}

export const ExplorationMode: React.FC<ExplorationModeProps> = ({ 
  monuments, 
  cities, 
  onExplored, 
  unlockedList,
  externalTarget,
  lang,
  userLocation
}) => {
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null);
  const [customCenter, setCustomCenter] = useState<[number, number] | null>(null);
  const [justUnlockedId, setJustUnlockedId] = useState<string | null>(null);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("morocco_tutorial_seen");
  });

  const handleTutorialComplete = () => {
    localStorage.setItem("morocco_tutorial_seen", "true");
    setShowTutorial(false);
  };

  useEffect(() => {
    if (!externalTarget) return;

    if ('cityId' in externalTarget) {
      // It's a monument
      setSelectedMonument(externalTarget);
      setCustomCenter(externalTarget.coords);
    } else {
      // It's a city
      setSelectedMonument(null);
      setCustomCenter(externalTarget.coords);
    }
  }, [externalTarget]);

  useEffect(() => {
    // Determine sound category from selected monument or city
    const category = selectedMonument?.soundCategory || (externalTarget && !('cityId' in externalTarget) ? (externalTarget as City).soundCategory : null);
    
    if (category) {
      audioService.play(category);
    } else {
      // Default ambient sound for general exploration
      audioService.play("nature");
    }

    return () => {
      // Silence on component change
    };
  }, [selectedMonument, externalTarget]);

  // Stop audio when exploration mode unmounts
  useEffect(() => {
    return () => {
      audioService.stop();
    };
  }, []);

  const handleMonumentSelect = (monument: Monument) => {
    setSelectedMonument(monument);
  };

  const handleExplored = (id: string) => {
    if (!unlockedList.includes(id)) {
      onExplored(id, 100);
      setJustUnlockedId(id);
      setShowUnlockToast(true);
      
      // Dramatic Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#ffffff', '#121214', '#f0d78c']
      });

      // Shimmer marker for 10s, but hide toast earlier
      setTimeout(() => setShowUnlockToast(false), 5000);
      setTimeout(() => setJustUnlockedId(null), 10 * 1000); 
    }
  };

  const unlockedMonument = justUnlockedId ? monuments.find(m => m.id === justUnlockedId) : null;
  const isAr = lang === "ar";
  
  const t = {
    toastHeader: isAr ? "تمت إعادة بناء المعلومات" : "Intelligence Reconstructed",
    toastSync: isAr ? "بنجاح Sync تم" : "Successfully Synced",
    xpGain: isAr ? "+100 XP تم اكتساب البيانات" : "+100 XP DATA_GAIN ACQUIRED",
    sigLocked: isAr ? "تم القفل" : "SIG_LKD",
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 relative p-4 md:p-6 overflow-hidden">
      <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl relative border border-border min-h-[300px] md:min-h-0">
        <MapComponent 
          monuments={monuments} 
          cities={cities} 
          onMonumentSelect={handleMonumentSelect} 
          selectedId={selectedMonument?.id}
          customCenter={customCenter}
          unlockedIds={unlockedList}
          justUnlockedId={justUnlockedId}
          userLocation={userLocation}
          lang={lang}
        />
      </div>

      <AnimatePresence>
        {selectedMonument && (
          <MonumentModal 
            monument={selectedMonument} 
            onClose={() => setSelectedMonument(null)} 
            onExplored={handleExplored}
            isExplored={unlockedList.includes(selectedMonument.id)}
            lang={lang}
            userLocation={userLocation}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnlockToast && unlockedMonument && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-xl"
          >
            <div className={cn(
              "bg-bg-deep/80 backdrop-blur-2xl border border-accent-gold/50 px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.2)] flex items-center gap-6 overflow-hidden relative",
              isAr ? "flex-row-reverse text-right" : "flex-row text-left"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 via-transparent to-accent-gold/5" />
              <div className="scanline opacity-[0.05]" />
              
              <div className="relative">
                <div className="w-14 h-14 bg-accent-gold/10 border border-accent-gold/30 rounded-2xl flex items-center justify-center text-accent-gold">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <ShieldCheck size={32} />
                  </motion.div>
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="w-4 h-4 bg-accent-gold rounded-full flex items-center justify-center animate-bounce">
                    <Zap size={10} className="text-bg-deep fill-current" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-accent-gold uppercase mb-1">
                  {t.toastHeader}
                </span>
                <h3 className="text-xl font-display font-medium text-text-main uppercase tracking-tight">
                  {isAr ? unlockedMonument.nameAr || unlockedMonument.name : unlockedMonument.name} {t.toastSync}
                </h3>
                <div className={cn("flex items-center gap-2 mt-2", isAr && "flex-row-reverse")}>
                  <div className="h-[1px] w-8 bg-accent-gold/30" />
                  <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{t.xpGain}</span>
                </div>
              </div>

              <div className={cn("ml-4 pl-6 border-white/10 flex flex-col items-center", isAr ? "border-r pr-6 ml-0 pl-0" : "border-l pl-6")}>
                 <CheckCircle2 size={24} className="text-accent-gold animate-pulse" />
                 <span className="text-[8px] font-mono text-accent-gold/40 mt-1">{t.sigLocked}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onComplete={handleTutorialComplete} />
        )}
      </AnimatePresence>
    </div>
  );
};
