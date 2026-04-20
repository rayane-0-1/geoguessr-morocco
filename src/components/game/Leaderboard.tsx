import React from "react";
import { ScoreBoardEntry, UserProfile } from "../../types";
import { Trophy, Shield, Star, LogOut, Clock } from "lucide-react";
import { motion } from "motion/react";
import { auth } from "../../lib/firebase";

interface LeaderboardProps {
  entries: ScoreBoardEntry[];
  user: UserProfile | null;
  lang: "ar" | "en";
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, user, lang }) => {
  const isAr = lang === "ar";
  
  // Sort entries by score descending
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full p-4 relative group">
      <div className="hud-bracket hud-bracket-tl" />
      <div className="hud-bracket hud-bracket-tr" />
      <div className="hud-bracket hud-bracket-bl" />
      <div className="hud-bracket hud-bracket-br" />

      <div className="flex flex-col gap-1 border-b border-white/5 pb-6">
        <h2 className="text-2xl font-display font-bold text-accent-gold uppercase tracking-[0.2em] flex items-center gap-3">
          <Shield className="text-accent-gold animate-pulse" />
          {isAr ? "لوحة المتصدرين" : "Tactical Leaderboard"}
        </h2>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            {isAr ? "كبار المشغلين المعتمدين / واجهة التصنيف العالمي" : "Top Authorized Operators / Global Rank Interface"}
          </p>
          <div className="flex gap-4">
            <span className="tech-label animate-pulse">{isAr ? "البث: نشط" : "LIVE_DATA_STREAM"}</span>
            <button 
              onClick={() => window.location.reload()}
              className="text-text-muted hover:text-accent-gold transition-all p-1.5 border border-white/5 rounded-lg group"
              title="REFRESH DATA"
            >
              <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                <Clock size={12} className="group-hover:rotate-45 transition-transform" />
              </motion.div>
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="tech-label text-rose-500 flex items-center gap-1 hover:brightness-125 transition-all"
            >
              <LogOut size={10} /> {isAr ? "تسجيل الخروج" : "LOGOUT"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Header Column */}
        <div className="grid grid-cols-[60px_1fr_120px_140px] px-6 py-2 border-b border-white/10 opacity-50">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">{isAr ? "الرتبة" : "Rank"}</span>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">{isAr ? "هوية المشغل" : "Operator Ident"}</span>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">{isAr ? "ملف الخبرة" : "Exp Profile"}</span>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">{isAr ? "مرجع القطاع" : "Sector_Ref"}</span>
        </div>

        <div className="flex flex-col gap-1 custom-scrollbar overflow-y-auto max-h-[600px] pr-2">
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry, index) => {
              const isTop3 = index < 3;
              const sectorId = `MA-${(Math.floor(Math.random() * 90) + 10)}`;
              const isCurrentUser = user && user.uid === entry.userId;

              return (
                <motion.div
                  key={`${entry.userId}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className={cn(
                    "grid grid-cols-[60px_1fr_120px_140px] px-6 py-4 border rounded-xl items-center group relative transition-all duration-500",
                    isCurrentUser 
                      ? "bg-accent-gold/10 border-accent-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.15)] ring-1 ring-accent-gold/20" 
                      : index === 0 
                      ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                      : index === 1
                      ? "bg-slate-400/10 border-slate-400/30 shadow-[0_0_20px_rgba(148,163,184,0.1)]"
                      : index === 2
                      ? "bg-orange-700/10 border-orange-700/30 shadow-[0_0_20px_rgba(194,65,12,0.1)]"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                  )}
                >
                  {/* Podium Glow effects */}
                  {index === 0 && <div className="absolute inset-0 bg-amber-500/5 blur-xl pointer-events-none rounded-xl" />}
                  
                  {isCurrentUser && (
                    <motion.div 
                      layoutId="active-user-indicator"
                      className="absolute -left-1 top-4 bottom-4 w-1.5 bg-accent-gold rounded-full shadow-[0_0_15px_#d4af37] z-20"
                    />
                  )}
                  
                  <div className="hud-bracket hud-bracket-tl opacity-0 group-hover:opacity-100" />
                  <div className="hud-bracket hud-bracket-tr opacity-0 group-hover:opacity-100" />
                  <div className="hud-bracket hud-bracket-bl opacity-0 group-hover:opacity-100" />
                  <div className="hud-bracket hud-bracket-br opacity-0 group-hover:opacity-100" />

                  <div className="flex items-center justify-center">
                    {index === 0 ? (
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
                        <Trophy size={14} className="text-amber-500" />
                      </div>
                    ) : index === 1 ? (
                      <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400 flex items-center justify-center">
                        <Trophy size={14} className="text-slate-400" />
                      </div>
                    ) : index === 2 ? (
                      <div className="w-8 h-8 rounded-full bg-orange-700/20 border border-orange-700 flex items-center justify-center">
                        <Trophy size={14} className="text-orange-700" />
                      </div>
                    ) : (
                      <span className={`text-xs font-mono font-bold ${isCurrentUser ? 'text-accent-gold underline underline-offset-4' : 'text-text-muted opacity-50'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center border overflow-hidden shrink-0 transition-all group-hover:scale-105",
                      index === 0 ? "bg-amber-500/20 border-amber-400/40" :
                      index === 1 ? "bg-slate-400/20 border-slate-400/40" :
                      index === 2 ? "bg-orange-700/20 border-orange-700/40" :
                      isCurrentUser ? "bg-accent-gold/20 border-accent-gold/40" : "bg-white/5 border-white/10"
                    )}>
                      {entry.photoURL ? (
                        <img src={entry.photoURL} alt={entry.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={cn(
                          "text-[10px] uppercase font-mono font-bold",
                          index === 0 ? "text-amber-500" :
                          index === 1 ? "text-slate-400" :
                          index === 2 ? "text-orange-700" :
                          isCurrentUser ? "text-accent-gold" : "text-text-muted"
                        )}>
                          {entry.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-display font-medium group-hover:text-accent-gold transition-colors italic truncate",
                          index === 0 ? "text-amber-400 font-bold" : "text-text-main"
                        )}>
                          {entry.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[7px] bg-accent-gold text-bg-deep px-1.5 py-0.5 rounded-sm font-bold tracking-tighter animate-pulse">
                            ACTIVE_OPERATOR
                          </span>
                        )}
                        {index === 0 && <Star size={10} className="text-amber-500 fill-amber-500" />}
                      </div>
                      <span className="tech-label opacity-40">IDENT: {entry.userId?.slice(0,6).toUpperCase() || "ANON"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-text-main tabular-nums">
                      {entry.score.toLocaleString()} <span className="text-[9px] text-accent-gold/60">XP</span>
                    </span>
                    {entry.gamesPlayed && (
                      <span className="text-[8px] font-mono text-text-muted uppercase">{entry.gamesPlayed} {isAr ? "مهمة" : "SESSIONS"}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent-gold/30" />
                    <span className="text-[10px] font-mono text-text-muted tracking-tighter">SEC_{sectorId}</span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl opacity-50">
              <Shield size={32} className="text-text-muted mb-4 animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-widest">{isAr ? "جاري البحث عن بيانات المسجل... لم يتم العثور على سجلات" : "Scanning global database... No logs found."}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
        <span className="text-[7px] font-mono uppercase tracking-[0.3em]">{isAr ? "بروتوكول الأمان" : "Security_Protocol"}: AES-256 Enabled</span>
        <span className="text-[7px] font-mono uppercase tracking-[0.3em]">{isAr ? "إجمالي الإدخالات" : "Total Entries Scanned"}: {entries.length}</span>
      </div>
    </div>
  );
};

import { cn } from "../../lib/utils";
