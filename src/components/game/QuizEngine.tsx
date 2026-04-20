import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QuizQuestion, Difficulty, QuizDifficultySettings, Monument, City } from "../../types";
import { CheckCircle2, XCircle, ArrowRight, BrainCircuit, Trophy, Timer, ShieldAlert, Loader2, Sparkles, History, Globe, Palette } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "../../lib/utils";
import { AIQuizService } from "../../services/aiQuizService";

const DIFFICULTY_SETTINGS: Record<Difficulty, QuizDifficultySettings> = {
  easy: { label: "EASY / INITIATE", questions: 5, time: 60, multiplier: 1.0 },
  medium: { label: "MEDIUM / ANALYST", questions: 8, time: 45, multiplier: 1.5 },
  hard: { label: "HARD / COMMANDER", questions: 12, time: 30, multiplier: 2.5 },
};

interface QuizEngineProps {
  monuments: Monument[];
  cities: City[];
  onComplete: (score: number) => void;
  onExit: () => void;
  lang: "ar" | "en";
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ monuments, cities, onComplete, onExit, lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    startTime: 0,
  });

  const isAr = lang === "ar";
  const t = {
    loadingTitle: isAr ? "توليف المعلومات" : "Synthesizing Intelligence",
    loadingDesc: isAr ? "مراجعة الأرشيفات التاريخية ومجموعات البيانات الثقافية لتوليد تحدٍ فريد..." : "Cross-referencing historical archives and cultural datasets for unique challenge generation...",
    selectTitle: isAr ? "اختر مستوى الكفاءة" : "Select Proficiency",
    selectDesc: isAr ? "طابق معرفتك مع التحدي" : "Match your knowledge to the challenge",
    easy: isAr ? "سهل / مبتدئ" : "EASY / INITIATE",
    medium: isAr ? "متوسط / محلل" : "MEDIUM / ANALYST",
    hard: isAr ? "صعب / قائد" : "HARD / COMMANDER",
    questions: isAr ? "أسئلة" : "Questions",
    seconds: isAr ? "ثانية" : "Seconds Limit",
    bonus: isAr ? "مكافأة" : "BONUS",
    disconnect: isAr ? "فصل الواجهة" : "Disconnect Interface",
    score: isAr ? "النتيجة" : "SCORE",
    protocol: isAr ? "بروتوكول" : "Protocol",
    questionOf: isAr ? "سؤال" : "QUESTION",
    of: isAr ? "من" : "OF",
    nextAnalysis: isAr ? "التحليل التالي" : "Next Analysis",
    showResults: isAr ? "عرض النتائج" : "Show Results",
    timeExpired: isAr ? "انتهى الوقت" : "Time Expired",
    quizEvaluated: isAr ? "تم تقييم الاختبار" : "Quiz Evaluated",
    forceTerminated: isAr ? "تم إنهاء الجلسة قسراً" : "Session Forcefully Terminated",
    profConfirmed: isAr ? "تم تأكيد الكفاءة التاريخية" : "Historical Proficiency Confirmed",
    finalPoints: isAr ? "نقاط التقييم النهائية" : "Final Evaluation Points",
    nextLevel: isAr ? "المستوى التالي (متكيف)" : "Next Level (Adaptive)",
    returnHome: isAr ? "العودة إلى مركز التحكم" : "Return to Control Center",
    categoryGeography: isAr ? "الجغرافيا" : "GEOGRAPHY",
    categoryHistory: isAr ? "التاريخ" : "HISTORY",
    categoryCulture: isAr ? "الثقافة" : "CULTURE",
    categoryGeneral: isAr ? "عام" : "GENERAL"
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case "geography": return t.categoryGeography;
      case "history": return t.categoryHistory;
      case "culture": return t.categoryCulture;
      default: return t.categoryGeneral;
    }
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to top on question change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const loadQuestions = async (level: Difficulty) => {
    setIsLoading(true);
    setDifficulty(level);
    const settings = DIFFICULTY_SETTINGS[level];
    
    const freshQuestions = await AIQuizService.generateQuestions({
      difficulty: level,
      count: settings.questions,
      lang,
      categories: [
        { category: "geography", weight: 0.4 },
        { category: "history", weight: 0.3 },
        { category: "culture", weight: 0.3 }
      ],
      contextData: { monuments, cities },
      excludeIds: []
    });

    setQuestions(freshQuestions);
    setTimeLeft(settings.time);
    setIsLoading(false);
    setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
  };

  // Timer Logic
  useEffect(() => {
    if (!difficulty || gameOver || timeLeft <= 0 || isLoading) {
      if (timeLeft === 0 && difficulty && !gameOver && !isLoading) {
        setGameOver(true);
        onComplete(score);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [difficulty, gameOver, timeLeft, score, onComplete]);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (option: string) => {
    if (isAnswered || !difficulty) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.answer;
    const settings = DIFFICULTY_SETTINGS[difficulty];

    if (isCorrect) {
      setScore(s => s + Math.round(200 * settings.multiplier));
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      confetti({
        particleCount: 80,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#c5a059', '#e0e0e0', '#2d2d30']
      });
    }

    // Adaptive Engine Logic: Check if we should adjust difficulty for FUTURE questions or batches
    // In this implementation, we apply it if the user completes the batch
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setGameOver(true);
      onComplete(score);
    }
  };

  const accuracy = questions.length > 0 ? (sessionStats.correct / questions.length) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-surface border border-border rounded-3xl p-8 shadow-2xl">
        <Loader2 className="animate-spin text-accent-gold mb-6" size={48} />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-accent-gold uppercase animate-pulse">
            {t.loadingTitle}
          </span>
          <p className="text-[9px] text-text-muted uppercase tracking-widest text-center max-w-xs">
            {t.loadingDesc}
          </p>
        </div>
      </div>
    );
  }

  if (!difficulty && !gameOver) {
    return (
      <div 
        ref={scrollRef}
        className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar relative"
      >
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="bg-accent-gold-muted p-4 rounded-3xl border border-accent-gold/20 mb-8 relative group">
            <div className="absolute -inset-2 border border-accent-gold/10 rounded-full animate-pulse opacity-50" />
            <BrainCircuit size={32} className="text-accent-gold group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-4xl font-serif text-text-main text-center mb-2 leading-tight uppercase tracking-tight">
            {t.selectTitle}
          </h2>
          <p className="text-text-muted text-[10px] uppercase tracking-[0.3em] font-mono mb-12">
            {t.selectDesc}
          </p>

          <div className="grid grid-cols-1 gap-4 w-full">
            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((level) => {
              const s = DIFFICULTY_SETTINGS[level];
              const label = level === "easy" ? t.easy : level === "medium" ? t.medium : t.hard;
              return (
                <button
                  key={level}
                  onClick={() => loadQuestions(level)}
                  className="group flex items-center justify-between p-6 bg-bg-deep/50 border border-border rounded-2xl hover:border-accent-gold hover:scale-[1.02] transition-all text-left hover-shine"
                >
                  <div className={cn(isAr && "text-right")}>
                    <h3 className="text-xl font-serif text-text-main group-hover:text-accent-gold transition-colors">{label}</h3>
                    <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1">
                      {s.questions} {t.questions} • {s.time} {t.seconds}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-accent-gold opacity-40 group-hover:opacity-100 transition-opacity">
                    x{s.multiplier.toFixed(1)} {t.bonus}
                  </div>
                </button>
              );
            })}
          </div>

          <button 
            onClick={onExit}
            className="mt-12 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors flex items-center gap-2"
          >
            <motion.div whileHover={{ x: isAr ? 3 : -3 }} transition={{ type: "spring", stiffness: 400 }}>
              {isAr ? "Disconnect Interface →" : "← " + t.disconnect}
            </motion.div>
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !gameOver) return null;

  return (
    <div 
      ref={scrollRef}
      className="flex-1 flex flex-col items-center p-4 md:p-8 bg-bg-surface border border-border rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar relative"
    >
      {/* HUD Header */}
      {!gameOver && (
        <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2 md:gap-4 bg-bg-deep/40 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-border/50">
            <Timer size={12} className={cn(timeLeft < 15 ? "text-rose-500 animate-pulse" : "text-accent-gold")} />
            <span className={cn("text-[10px] md:text-xs font-mono font-bold w-10 md:w-12", timeLeft < 15 ? "text-rose-500" : "text-text-main")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className={cn("flex items-center gap-4 bg-bg-deep/40 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50", isAr && "flex-row-reverse")}>
            <span className="text-[10px] font-mono tracking-tighter text-text-muted">{t.score}: {score}</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!gameOver ? (
          <motion.div
            key={currentIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="w-full max-w-2xl flex flex-col items-center mt-12"
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-accent-gold-muted p-3 rounded-2xl border border-accent-gold/20">
                <BrainCircuit size={24} className="text-accent-gold" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-accent-gold uppercase flex items-center gap-2">
                  {(difficulty && (difficulty === "easy" ? t.easy : difficulty === "medium" ? t.medium : t.hard))} {t.protocol}
                  {currentQuestion.source === "AI" && <Sparkles size={10} className="text-accent-gold animate-pulse" />}
                </span>
                <span className={cn("text-text-muted text-[10px] font-mono tracking-tighter uppercase flex items-center gap-2", isAr && "flex-row-reverse")}>
                  {t.questionOf} {currentIndex + 1} {t.of} {questions.length}
                  <span className="opacity-30">•</span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-deep/50 rounded-full border border-border/50">
                    {currentQuestion.category === "geography" && <Globe size={10} className="text-blue-400/70" />}
                    {currentQuestion.category === "history" && <History size={10} className="text-amber-400/70" />}
                    {currentQuestion.category === "culture" && <Palette size={10} className="text-purple-400/70" />}
                    {!currentQuestion.category && <Sparkles size={10} className="text-accent-gold/70" />}
                    <span className="text-[9px] font-bold tracking-tight text-text-main/80">
                      {getCategoryLabel(currentQuestion.category)}
                    </span>
                  </span>
                </span>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-serif text-text-main text-center mb-8 md:mb-12 leading-tight min-h-[3rem] md:min-h-[4rem]">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentQuestion.options.map((option) => {
                const isCorrect = option === currentQuestion.answer;
                const isSelected = option === selectedOption;
                const showCorrect = isAnswered && isCorrect;
                const showWrong = isAnswered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(option)}
                    initial={false}
                    animate={
                      showCorrect
                        ? { 
                            scale: [1, 1.05, 1],
                            borderColor: "rgba(16, 185, 129, 1)",
                            backgroundColor: "rgba(16, 185, 129, 0.2)"
                          }
                        : showWrong
                        ? { 
                            x: [-4, 4, -4, 4, 0],
                            borderColor: "rgba(244, 63, 94, 1)",
                            backgroundColor: "rgba(244, 63, 94, 0.2)"
                          }
                        : isAnswered && !isCorrect && !isSelected
                        ? { opacity: 0.4, scale: 0.98 }
                        : {}
                    }
                    whileHover={!isAnswered ? { scale: 1.02, borderColor: "rgba(197, 160, 89, 0.5)" } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    className={cn(
                      "group relative p-4 md:p-6 rounded-2xl text-left transition-all border outline-none overflow-hidden",
                      !isAnswered && "bg-bg-deep/50 border-border",
                      showCorrect && "text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)] z-10",
                      showWrong && "text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.15)] z-10",
                      isAnswered && !isCorrect && !isSelected && "border-transparent"
                    )}
                  >
                    {/* Visual indicators for state */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 hidden md:block" />
                    
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-mono transition-colors",
                          !isAnswered && "border-border text-text-muted group-hover:border-accent-gold group-hover:text-accent-gold",
                          isSelected && !isAnswered && "bg-accent-gold border-accent-gold text-bg-deep",
                          showCorrect && "bg-emerald-500 border-emerald-500 text-white",
                          showWrong && "bg-rose-500 border-rose-500 text-white",
                          isAnswered && !isCorrect && !isSelected && "opacity-20"
                        )}>
                          {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                        </div>
                        <span className="font-light tracking-wide text-sm md:text-base leading-snug">{option}</span>
                      </div>
                      <AnimatePresence>
                        {showCorrect && (
                          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                          </motion.div>
                        )}
                        {showWrong && (
                          <motion.div initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }}>
                            <XCircle size={18} className="text-rose-500 shrink-0" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-12 p-6 bg-bg-deep/30 border border-border rounded-2xl w-full text-center"
              >
                <p className="text-xs text-text-muted italic mb-6">
                  {currentQuestion.explanation}
                </p>
                <button 
                  onClick={handleNext}
                  className="px-8 py-3 bg-accent-gold text-bg-deep text-[11px] font-bold tracking-widest rounded-xl hover:brightness-110 transition-all uppercase flex items-center gap-2 mx-auto"
                >
                  {currentIndex < questions.length - 1 ? t.nextAnalysis : t.showResults} <ArrowRight size={16} className={cn(isAr && "rotate-180")} />
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            {timeLeft <= 0 ? (
              <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/20 drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                <ShieldAlert size={48} className="text-bg-deep" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-accent-gold rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-accent-gold/20 drop-shadow-[0_0_20px_rgba(197,160,89,0.3)]">
                <Trophy size={48} className="text-bg-deep" />
              </div>
            )}
            
                  <h2 className="text-4xl font-serif text-text-main mb-2">
                    {timeLeft <= 0 ? t.timeExpired : t.quizEvaluated}
                  </h2>
                  <p className="text-text-muted text-sm tracking-widest uppercase font-mono mb-10">
                    {timeLeft <= 0 ? t.forceTerminated : t.profConfirmed}
                  </p>
            
            <div className="text-6xl font-mono text-accent-gold mb-12 flex flex-col items-center">
              <span className="text-[10px] text-text-muted tracking-[0.4em] uppercase mb-2">{t.finalPoints}</span>
              {score}
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
              {(accuracy >= 0.7 && difficulty !== "hard") && (
                <button 
                  onClick={() => {
                    AIQuizService.resetSession();
                    loadQuestions(difficulty === "easy" ? "medium" : "hard");
                    setGameOver(false);
                    setCurrentIndex(0);
                    setScore(0);
                    setSelectedOption(null);
                    setIsAnswered(false);
                  }}
                  className="btn-tactical bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 w-full flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> {t.nextLevel}
                </button>
              )}
              
              <button 
                onClick={onExit}
                className="btn-tactical btn-tactical-gold hover-shine w-full"
              >
                {t.returnHome}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
