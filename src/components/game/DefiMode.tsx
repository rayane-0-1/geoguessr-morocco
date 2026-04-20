import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monument } from "../../types";
import { Clock, Target, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Play, Trophy } from "lucide-react";
import { MapComponent } from "./MapComponent.tsx";
import confetti from "canvas-confetti";
import { shuffleArray, cn } from "../../lib/utils";

interface DefiModeProps {
  monuments: Monument[];
  onComplete: (score: number) => void;
  onExit: () => void;
  lang: "ar" | "en";
}

export const DefiMode: React.FC<DefiModeProps> = ({ monuments, onComplete, onExit, lang }) => {
  const [gameState, setGameState] = useState<"starting" | "playing" | "result" | "end">("starting");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targets, setTargets] = useState<Monument[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [guessCoords, setGuessCoords] = useState<[number, number] | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastXP, setLastXP] = useState<number | null>(null);

  const isAr = lang === "ar";
  const t = {
    timeRemaining: isAr ? "الوقت المتبقي" : "TIME REMAINING",
    modeHeader: isAr ? "وضع التحدي" : "Challenge Mode",
    modeDesc: isAr ? "حدد 5 معالم بأسرع ما يمكن لمضاعفة نتيجتك. يجب عليك النقر على الموقع التقريبي على الخريطة." : "Identify 5 monuments as fast as possible to maximize your score. You must click the approximate location on the map.",
    init: isAr ? "بدء التحدي" : "INITIALIZE CHALLENGE",
    objectiveOf: isAr ? "الهدف" : "OBJECTIVE",
    locate: isAr ? "حدد موقع:" : "Locate:",
    tacticalMatch: isAr ? "مطابقة تكتيكية" : "Tactical Match",
    offTarget: isAr ? "خارج الهدف" : "Off Target",
    distance: isAr ? "المسافة" : "Distance",
    impact: isAr ? "التأثير" : "Impact",
    nextAnalysis: isAr ? "التحليل التالي" : "Next Analysis",
    finalize: isAr ? "إنهاء التقرير" : "Finalize Report",
    endEarly: isAr ? "إنهاء التحدي مبكراً" : "End Challenge Early",
    timedOut: isAr ? "انتهى الوقت" : "Timed Out",
    opSuccess: isAr ? "نجاح العملية" : "Operation Success",
    finalPoints: isAr ? "نقاط التقييم النهائية" : "Final Evaluation Points",
    backToControl: isAr ? "العودة إلى مركز التحكم" : "BACK TO CONTROL",
    waiting: isAr ? "في انتظار المزامنة..." : "Waiting for synchronization...",
    pressInit: isAr ? "اضغط على بدء التحدي لبدء مسح القمر الصناعي. سيظهر لك معلم للعثور عليه على الخريطة." : "Press INITIALIZE CHALLENGE to begin the satellite scan. You will be shown a monument to find on the map."
  };

  useEffect(() => {
    if (gameState === "starting") {
      setTargets(shuffleArray(monuments).slice(0, 5));
    }
  }, [gameState, monuments]);

  const currentTarget = targets[currentIndex];

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateXP = (distanceKm: number) => {
    // XP = 800 * exp(-distance_km / 150)
    // Capped at 800 to keep it in the "hundreds" range
    return Math.round(800 * Math.exp(-distanceKm / 150));
  };

  const handleMapClick = (coords: [number, number]) => {
    if (feedback || gameState !== "playing" || !currentTarget) return;

    setGuessCoords(coords);
    const distance = getHaversineDistance(coords[0], coords[1], currentTarget.coords[0], currentTarget.coords[1]);
    const earnedXP = calculateXP(distance);
    
    setLastDistance(distance);
    setLastXP(earnedXP);

    // Consider "Correct" if within 30km
    const isCorrect = distance < 30;
    setFeedback(isCorrect ? "correct" : "wrong");
    setScore(s => s + earnedXP);
    setGameState("result");

    if (distance < 15) {
      confetti({ 
        particleCount: 100, 
        spread: 90, 
        origin: { y: 0.7 },
        colors: ['#d4af37', '#ffffff', '#8a2be2']
      });
    }
  };

  const nextTarget = () => {
    setFeedback(null);
    setGuessCoords(null);
    setLastDistance(null);
    setLastXP(null);

    if (currentIndex < targets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(15);
      setGameState("playing");
    } else {
      setGameState("end");
      onComplete(score);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0 && !feedback) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === "playing") {
      // Automatic transition to end on timeout
      setGameState("end");
      onComplete(score);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, feedback]);

  const startChallenge = () => {
    setGameState("playing");
    setScore(0);
    setCurrentIndex(0);
    setTimeLeft(15);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 relative p-4 md:p-6 overflow-hidden">
      {/* Simulation Info Console */}
      <div className="w-full md:w-[300px] flex flex-col gap-4 md:gap-6 z-20 shrink-0 h-[40vh] md:h-auto overflow-hidden">
        <div className="flex-1 p-6 md:p-8 bg-bg-surface border border-border rounded-3xl shadow-2xl flex flex-col items-center text-center overflow-y-auto custom-scrollbar">
          <div className="mb-10 w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-gold-muted border border-accent-gold/20 flex items-center justify-center">
                <Clock size={16} className="text-accent-gold" />
              </div>
              <div className={cn("flex flex-col text-left", isAr && "text-right")}>
                <span className="text-[10px] font-bold tracking-widest text-accent-gold uppercase">{t.timeRemaining}</span>
                <span className={`text-xl font-mono tabular-nums ${timeLeft < 5 ? "text-rose-500 animate-pulse" : "text-text-main"}`}>
                  {timeLeft.toString().padStart(2, "0")}s
                </span>
              </div>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-accent-gold"
                 initial={{ width: "100%" }}
                 animate={{ width: `${(timeLeft / 15) * 100}%` }}
               />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {gameState === "starting" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="p-4 bg-accent-gold-muted border border-accent-gold/20 rounded-2xl mb-6">
                  <Play size={32} className="text-accent-gold" />
                </div>
                <h3 className="text-xl font-serif text-text-main mb-4">{t.modeHeader}</h3>
                <p className="text-xs text-text-muted mb-8 leading-relaxed italic">{t.modeDesc}</p>
                <button 
                  onClick={startChallenge}
                  className="btn-tactical btn-tactical-gold hover-shine w-full"
                >
                  {t.init}
                </button>
              </motion.div>
            )}

            {(gameState === "playing" || gameState === "result") && currentTarget && (
              <motion.div 
                 key={currentIndex}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center w-full"
              >
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border mb-6">
                  <img 
                    src={currentTarget.imageUrl} 
                    alt={currentTarget.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent" />
                </div>

                <div className="w-12 h-12 bg-accent-gold-muted border border-accent-gold/30 rounded-2xl flex items-center justify-center mb-4">
                  <Target size={24} className="text-accent-gold" />
                </div>
                <p className="text-[10px] text-text-muted font-mono mb-2 uppercase tracking-widest">{t.objectiveOf} {currentIndex + 1} / 5</p>
                <h2 className={cn("text-xl font-serif text-text-main mb-6 border-b border-border pb-4 w-full", isAr && "text-right")}>
                  {t.locate} <br />
                  <span className="text-accent-gold">{isAr ? (currentTarget.nameAr || currentTarget.name) : currentTarget.name}</span>
                </h2>

                <AnimatePresence mode="wait">
                  {gameState === "result" && lastDistance !== null && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      className="flex flex-col items-center w-full gap-4"
                    >
                      {/* Success Badge */}
                      <motion.div 
                        initial={{ scale: 0.5, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full border mb-2
                          ${feedback === "correct" 
                            ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                            : "bg-rose-500/10 border-rose-500/30 text-rose-500"}`}
                      >
                        {feedback === "correct" ? (
                          <>
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <CheckCircle2 size={16} />
                            </motion.div>
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t.tacticalMatch}</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t.offTarget}</span>
                          </>
                        )}
                      </motion.div>

                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className={`p-4 rounded-2xl border transition-colors flex flex-col items-center
                          ${feedback === "correct" ? "bg-white/[0.03] border-white/5" : "bg-rose-500/[0.02] border-rose-500/10"}`}>
                          <span className="text-[9px] text-text-muted uppercase tracking-widest mb-1">{t.distance}</span>
                          <span className={`text-lg font-mono ${feedback === "wrong" ? "text-rose-500/80" : "text-text-main"}`}>
                            {lastDistance.toFixed(1)} km
                          </span>
                        </div>
                        <div className={`p-4 rounded-2xl border transition-colors flex flex-col items-center
                          ${feedback === "correct" ? "bg-accent-gold/5 border-accent-gold/20" : "bg-white/[0.03] border-white/5"}`}>
                          <span className="text-[9px] text-text-muted uppercase tracking-widest mb-1">{t.impact}</span>
                          <span className={`text-lg font-mono ${feedback === "correct" ? "text-accent-gold" : "text-text-muted"}`}>
                            +{lastXP} XP
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 w-full">
                        <button 
                          onClick={nextTarget}
                          className="btn-tactical btn-tactical-gold hover-shine w-full flex items-center justify-center gap-2"
                        >
                          {currentIndex < targets.length - 1 ? t.nextAnalysis : t.finalize} <ArrowRight size={14} className={cn("group-hover:translate-x-1 transition-transform", isAr && "rotate-180 group-hover:-translate-x-1")} />
                        </button>
                        
                        <button 
                          onClick={() => {
                            setGameState("end");
                            onComplete(score);
                          }}
                          className="btn-tactical btn-tactical-outline w-full"
                        >
                          {t.endEarly}
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {timeLeft === 0 && gameState === "playing" && !feedback && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center">
                      <AlertTriangle size={40} className="text-rose-500 mb-2" />
                      <span className="text-rose-500 text-[10px] font-bold tracking-widest uppercase">{t.timedOut}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {gameState === "end" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                <Trophy size={48} className="text-accent-gold mb-6 drop-shadow-[0_0_15px_rgba(197,160,89,0.3)]" />
                <h3 className="text-2xl font-serif text-text-main mb-2">{t.opSuccess}</h3>
                <div className="text-4xl font-mono text-text-main mb-10 tabular-nums">
                  {score.toString().padStart(5, "0")}
                </div>
                <button 
                  onClick={onExit}
                  className="w-full py-4 bg-accent-gold text-bg-deep text-[11px] font-bold tracking-widest rounded-xl hover:brightness-110 transition-all uppercase"
                >
                  {t.backToControl}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Map Interactor */}
      <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl relative border border-border">
        <MapComponent 
          monuments={monuments} 
          cities={[]} 
          onMapClick={handleMapClick}
          hideMarkers={gameState !== "result"}
          guessCoords={guessCoords}
          targetCoords={currentTarget?.coords}
          showResult={gameState === "result"} 
        />
        {(gameState === "starting" || gameState === "end") && (
          <div className="absolute inset-0 bg-bg-deep/60 backdrop-blur-sm z-30 flex items-center justify-center p-12 text-center pointer-events-none">
            {gameState === "starting" && (
              <div className="max-w-md">
                <p className="text-accent-gold font-mono text-[10px] tracking-[0.5em] uppercase mb-4 animate-pulse">{t.waiting}</p>
                <p className="text-text-muted text-sm italic">{t.pressInit}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
