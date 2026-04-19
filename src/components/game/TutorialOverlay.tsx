import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MousePointer2, ZoomIn, Info, Play, X, ChevronRight, Globe } from "lucide-react";
import { cn } from "../../lib/utils";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: TutorialStep[] = [
  {
    title: "Welcome, Operator",
    description: "You've been authorized to access the Moroccan Digital Heritage interface. Let's synchronize your synchronization with the field.",
    icon: <Globe size={40} className="text-accent-gold" />
  },
  {
    title: "Orbital Navigation",
    description: "Use your mouse or touch to pan across the Moroccan territory. Scroll to zoom in on specific tactical sectors.",
    icon: <ZoomIn size={40} className="text-accent-gold" />
  },
  {
    title: "Identify Objectives",
    description: "Monuments are marked with golden hex-indicators. Click them to initialize a detailed reconnaissance scan.",
    icon: <MousePointer2 size={40} className="text-accent-gold" />
  },
  {
    title: "Tactical Data",
    description: "Once scanned, you can access 360° street-level feeds and archvial architectural blueprints. Exploring increases your XP.",
    icon: <Info size={40} className="text-accent-gold" />
  }
];

export const TutorialOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="scanline" />
        <div className="hud-bracket hud-bracket-tl" />
        <div className="hud-bracket hud-bracket-tr" />
        <div className="hud-bracket hud-bracket-bl" />
        <div className="hud-bracket hud-bracket-br" />

        <div className="p-10 flex flex-col items-center text-center">
          <button 
            onClick={onComplete}
            className="absolute top-6 right-6 p-2 text-text-muted hover:text-white transition-colors border border-white/5 rounded-full hover:bg-white/5"
          >
            <X size={16} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-20 h-20 rounded-3xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center mb-10 relative">
                <div className="absolute -inset-2 border border-accent-gold/10 rounded-[32px] animate-pulse" />
                {steps[currentStep].icon}
              </div>

              <span className="text-[10px] font-mono font-bold tracking-[0.5em] text-accent-gold uppercase mb-3 block">
                PHASE_0{currentStep + 1} // INITIALIZATION
              </span>
              <h2 className="text-3xl font-display font-bold text-text-main mb-6 tracking-tight uppercase">
                {steps[currentStep].title}
              </h2>
              <p className="text-text-muted text-sm leading-relaxed mb-12 max-w-sm opacity-80">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="w-full flex flex-col gap-6">
            <div className="flex justify-center gap-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    idx === currentStep ? "w-8 bg-accent-gold" : "w-2 bg-white/10"
                  )}
                />
              ))}
            </div>

            <button 
              onClick={handleNext}
              className="w-full py-5 bg-accent-gold text-bg-deep rounded-2xl font-bold tracking-[0.3em] text-[10px] uppercase flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent-gold/20 group"
            >
              {currentStep === steps.length - 1 ? "Initialize Console" : "Next Protocol"} 
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="bg-bg-deep/50 py-4 px-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-[7px] font-mono text-text-muted/40 uppercase tracking-widest">Training_Module: Operational</span>
            <span className="text-[7px] font-mono text-text-muted/40 uppercase tracking-widest">AUTH_LVL: LEVEL_2</span>
        </div>
      </motion.div>
    </div>
  );
};
