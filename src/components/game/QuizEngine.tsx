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
            Synthesizing Intelligence
          </span>
          <p className="text-[9px] text-text-muted uppercase tracking-widest text-center max-w-xs">
            Cross-referencing historical archives and cultural datasets for unique challenge generation...
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
            {lang === "ar" ? "اختر مستوى Proficiency" : "Select Proficiency"}
          </h2>
          <p className="text-text-muted text-[10px] uppercase tracking-[0.3em] font-mono mb-12">
            {lang === "ar" ? "طابق معرفتك مع التحدي" : "Match your knowledge to the challenge"}
          </p>

          <div className="grid grid-cols-1 gap-4 w-full">
            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((level) => {
              const s = DIFFICULTY_SETTINGS[level];
              return (
                <button
                  key={level}
                  onClick={() => loadQuestions(level)}
                  className="group flex items-center justify-between p-6 bg-bg-deep/50 border border-border rounded-2xl hover:border-accent-gold hover:scale-[1.02] transition-all text-left hover-shine"
                >
                  <div>
                    <h3 className="text-xl font-serif text-text-main group-hover:text-accent-gold transition-colors">{s.label}</h3>
                    <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1">
                      {s.questions} Questions • {s.time} Seconds Limit
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-accent-gold opacity-40 group-hover:opacity-100 transition-opacity">
                    x{s.multiplier.toFixed(1)} BONUS
                  </div>
                </button>
              );
            })}
          </div>

          <button 
            onClick={onExit}
            className="mt-12 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors flex items-center gap-2"
          >
            <motion.div whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 400 }}>
              ← Disconnect Interface
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
      className="flex-1 flex flex-col items-center p-8 bg-bg-surface border border-border rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar relative"
    >
      {/* HUD Header */}
      {!gameOver && (
        <div className="absolute top-0 left-0 w-full p-8 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-4 bg-bg-deep/40 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50">
            <Timer size={14} className={cn(timeLeft < 15 ? "text-rose-500 animate-pulse" : "text-accent-gold")} />
            <span className={cn("text-xs font-mono font-bold w-12", timeLeft < 15 ? "text-rose-500" : "text-text-main")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-4 bg-bg-deep/40 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50">
            <span className="text-[10px] font-mono tracking-tighter text-text-muted">SCORE: {score}</span>
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
                  {difficulty && DIFFICULTY_SETTINGS[difficulty].label} Protocol
                  {currentQuestion.source === "AI" && <Sparkles size={10} className="text-accent-gold animate-pulse" />}
                </span>
                <span className="text-text-muted text-[10px] font-mono tracking-tighter uppercase flex items-center gap-2">
                  QUESTION {currentIndex + 1} OF {questions.length}
                  <span className="opacity-30">•</span>
                  <span className="flex items-center gap-1">
                    {currentQuestion.category === "geography" && <Globe size={10} />}
                    {currentQuestion.category === "history" && <History size={10} />}
                    {currentQuestion.category === "culture" && <Palette size={10} />}
                    {currentQuestion.category || "General"}
                  </span>
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-serif text-text-main text-center mb-12 leading-tight min-h-[4rem]">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentQuestion.options.map((option) => {
                const isCorrect = option === currentQuestion.answer;
                const isSelected = option === selectedOption;
                const showCorrect = isAnswered && isCorrect;
                const showWrong = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "group relative p-6 rounded-2xl text-left transition-all border outline-none",
                      !isAnswered && "bg-bg-deep/50 border-border hover:border-accent-gold/50 hover:scale-[1.02]",
                      showCorrect && "bg-emerald-500/20 border-emerald-500/50 text-emerald-100",
                      showWrong && "bg-rose-500/20 border-rose-500/50 text-rose-100",
                      isAnswered && !isCorrect && !isSelected && "opacity-40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-light tracking-wide">{option}</span>
                      {showCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                      {showWrong && <XCircle size={20} className="text-rose-500" />}
                    </div>
                  </button>
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
                  {currentIndex < questions.length - 1 ? "Next Analysis" : "Show Results"} <ArrowRight size={16} />
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
                    {timeLeft <= 0 ? (lang === "ar" ? "انتهى الوقت" : "Time Expired") : (lang === "ar" ? "تم تقييم الاختبار" : "Quiz Evaluated")}
                  </h2>
                  <p className="text-text-muted text-sm tracking-widest uppercase font-mono mb-10">
                    {timeLeft <= 0 ? (lang === "ar" ? "تم إنهاء الجلسة قسراً" : "Session Forcefully Terminated") : (lang === "ar" ? "تم تأكيد الكفاءة التاريخية" : "Historical Proficiency Confirmed")}
                  </p>
            
            <div className="text-6xl font-mono text-accent-gold mb-12 flex flex-col items-center">
              <span className="text-[10px] text-text-muted tracking-[0.4em] uppercase mb-2">Final Evaluation Points</span>
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
                  <Sparkles size={16} /> {lang === "ar" ? "المستوى التالي (متكيف)" : "Next Level (Adaptive)"}
                </button>
              )}
              
              <button 
                onClick={onExit}
                className="btn-tactical btn-tactical-gold hover-shine w-full"
              >
                {lang === "ar" ? "العودة إلى مركز التحكم" : "Return to Control Center"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
