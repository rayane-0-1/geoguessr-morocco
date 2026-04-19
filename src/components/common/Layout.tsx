import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Trophy, Map as MapIcon, HelpCircle, Clock, Home, Info, X, Lock, LogOut, Languages } from "lucide-react";
import { GameMode, Monument, City, UserProfile } from "../../types";
import { cn } from "../../lib/utils";
import { auth } from "../../lib/firebase";

interface LayoutProps {
  children: React.ReactNode;
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  monuments: Monument[];
  cities: City[];
  onSearchSelect: (item: Monument | City) => void;
  score: number;
  user: UserProfile | null;
  lang: "ar" | "en";
  onToggleLang: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeMode, 
  onModeChange, 
  monuments,
  cities,
  onSearchSelect,
  score,
  user,
  lang,
  onToggleLang
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const isAr = lang === "ar";

  const t = {
    search: isAr ? "مسح المنطقة / الهدف" : "SCAN REGION / OBJ",
    satLink: isAr ? "ارتباط_القمر_الصناعي" : "SATELLITE_LINK",
    monument: isAr ? "معلم" : "Monument",
    city: isAr ? "مدينة" : "City",
    tacticalActive: isAr ? "التحدي التكتيكي نشط" : "Tactical Challenge Active",
    explore: isAr ? "استكشف" : "Explore",
    quiz: isAr ? "اختبار" : "Quiz",
    defi: isAr ? "تحدي" : "Défi"
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    
    const matchedMonuments = monuments.filter(m => 
      m.name.toLowerCase().includes(query) || 
      (m.nameAr && m.nameAr.includes(query)) ||
      m.cityId.toLowerCase().includes(query)
    );
    const matchedCities = cities.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.nameAr && c.nameAr.includes(query))
    );

    return [...matchedMonuments, ...matchedCities].slice(0, 5);
  }, [searchQuery, monuments, cities]);

  return (
    <div className="flex min-h-screen bg-bg-deep text-text-main font-sans selection:bg-accent-gold selection:text-bg-deep" dir={isAr ? "rtl" : "ltr"}>
      {/* Navigation Sidebar */}
      <aside className={cn(
        "bg-bg-surface border-border flex flex-col items-center py-8 gap-8 z-50 w-[80px] shrink-0 sticky top-0 h-screen",
        isAr ? "border-l" : "border-r"
      )}>
        <div 
          onClick={() => onModeChange("idle")}
          className="cursor-pointer mb-4 hover:scale-110 transition-transform active:scale-95"
        >
          {/* Mock Logo from design */}
          <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center p-2 relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)]">
             <div className="absolute inset-[3px] rounded-[10px] bg-bg-surface" />
             <div className="w-1 h-1 bg-accent-gold rounded-full relative z-10 animate-pulse" />
          </div>
        </div>

        <nav className="flex flex-col gap-8 relative">
          <div className={cn("absolute top-0 bottom-0 w-[1px] bg-white/5", isAr ? "left-0 -ml-4" : "right-0 -mr-4")} />
          <NavIcon 
            icon={<MapIcon size={18} />} 
            label={t.explore} 
            active={activeMode === "exploration"} 
            onClick={() => onModeChange("exploration")} 
            isAr={isAr}
          />
          <NavIcon 
            icon={<HelpCircle size={18} />} 
            label={t.quiz} 
            active={activeMode === "quiz"} 
            onClick={() => onModeChange("quiz")} 
            isAr={isAr}
          />
          <NavIcon 
            icon={<Clock size={18} />} 
            label={t.defi} 
            active={activeMode === "defi"} 
            onClick={() => onModeChange("defi")} 
            isAr={isAr}
          />
        </nav>

        <div className="mt-auto flex flex-col gap-6 items-center">
          <NavIcon 
            icon={<Trophy size={18} />} 
            label={isAr ? "الترتيب" : "RANK"} 
            active={activeMode === "leaderboard"} 
            onClick={() => onModeChange("leaderboard")} 
            isAr={isAr}
          />
          {user && (
            <button 
              onClick={() => auth.signOut()}
              className="text-text-muted hover:text-rose-500 transition-colors p-2 border border-border rounded-lg group"
              title="LOGOUT"
            >
              <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button className="text-text-muted hover:text-accent-gold transition-colors p-2 border border-border rounded-lg">
            <Info size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content (Map/Game) + HUD Header */}
      <main className="relative flex-1 flex flex-col min-w-0 pointer-events-auto min-h-screen">
        <div className="scanline" />
        <div className="noise-texture" />
        
        {/* HUD Header Pills */}
        <header className={cn(
          "absolute top-6 left-6 right-6 flex justify-between items-start z-40 pointer-events-none",
          isAr ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn("flex flex-col gap-4 pointer-events-auto", isAr ? "items-end" : "items-start")}>
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative flex items-center gap-4 bg-bg-deep/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl group cursor-default"
            >
              <div className="hud-bracket hud-bracket-tl" />
              <div className="hud-bracket hud-bracket-tr" />
              <div className="hud-bracket hud-bracket-bl" />
              <div className="hud-bracket hud-bracket-br" />
              
              <div className={cn("flex flex-col", isAr ? "text-right" : "text-left")}>
                <span className="text-[10px] font-bold text-accent-gold tracking-[0.4em] uppercase mb-1 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-accent-gold animate-ping" />
                  {t.satLink}
                </span>
                <span className="text-2xl font-display font-bold text-text-main tabular-nums leading-none flex items-baseline gap-2 group-hover:text-accent-gold transition-colors duration-500">
                  {score.toLocaleString()} <span className="text-[10px] text-text-muted font-mono tracking-widest group-hover:text-accent-gold/60 transition-colors">XP</span>
                </span>
              </div>

              {user?.photoURL && (
                <div className="w-10 h-10 rounded-xl border border-accent-gold/30 p-1 bg-accent-gold/5 ml-2">
                   <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-lg" />
                </div>
              )}
            </motion.div>

            {/* Search Interface */}
            <div className="relative w-64 md:w-80 group">
              <div className={cn(
                "flex items-center gap-3 bg-bg-deep/40 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-2xl relative",
                isSearchFocused ? "border-accent-gold/50 ring-1 ring-accent-gold/20 w-full" : "w-48 opacity-80",
                isAr ? "flex-row-reverse" : "flex-row"
              )}>
                <div className="hud-bracket hud-bracket-tl" />
                <div className="hud-bracket hud-bracket-tr" />
                <div className="hud-bracket hud-bracket-bl" />
                <div className="hud-bracket hud-bracket-br" />

                <Search size={14} className={cn("transition-colors", isSearchFocused ? "text-accent-gold" : "text-text-muted")} />
                <input 
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className={cn(
                    "bg-transparent border-none outline-none text-[10px] font-mono tracking-widest text-text-main placeholder:text-text-muted/50 w-full uppercase",
                    isAr ? "text-right" : "text-left"
                  )}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-text-muted hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isSearchFocused && filteredItems.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                  >
                    <div className="p-2 flex flex-col gap-1">
                      {filteredItems.map((item, idx) => {
                        const isMonument = 'cityId' in item;
                        return (
                          <button
                            key={`${isMonument ? 'mon' : 'city'}-${item.id}`}
                            onClick={() => {
                              onSearchSelect(item);
                              setSearchQuery("");
                              setIsSearchFocused(false);
                            }}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-all group",
                              isAr ? "flex-row-reverse text-right" : "flex-row text-left",
                              searchQuery && (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.nameAr && item.nameAr.includes(searchQuery.toLowerCase()))) && "bg-accent-gold/5 border border-accent-gold/10"
                            )}
                          >
                            <div className="flex flex-col">
                              <div className={cn("flex items-center gap-2", isAr ? "flex-row-reverse" : "flex-row")}>
                                <span className={cn(
                                  "text-[10px] font-display font-medium group-hover:text-accent-gold transition-colors",
                                  searchQuery && (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.nameAr && item.nameAr.includes(searchQuery.toLowerCase()))) ? "text-accent-gold" : "text-text-main"
                                )}>
                                  {lang === 'ar' ? (item.nameAr || item.name) : item.name}
                                </span>
                                {(item.nameAr && lang !== 'ar') && (
                                  <span className="text-[9px] font-sans text-accent-gold/40" dir="rtl">{item.nameAr}</span>
                                )}
                              </div>
                              <span className="text-[8px] font-mono text-text-muted uppercase tracking-tighter">
                                {isMonument ? `${t.monument} • ${item.cityId}` : `${t.city} • Region_MA`}
                              </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Search size={10} className="text-accent-gold" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-accent-gold/5 py-1.5 px-4 border-t border-white/5 text-center">
                      <span className="text-[7px] font-mono text-accent-gold/40 uppercase tracking-[0.2em]">Orbital_Data_Sync_Active</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {activeMode === "defi" && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3 bg-rose-500/10 backdrop-blur-md border border-rose-500/30 px-4 py-2 rounded-xl"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-500 tracking-[0.2em] uppercase">{t.tacticalActive}</span>
              </motion.div>
            )}
          </div>

          <div className={cn("pointer-events-auto flex flex-col gap-3", isAr ? "items-start" : "items-end")}>
            <div className="bg-bg-deep/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl flex gap-1 shadow-2xl">
              <ModeToggle 
                active={activeMode === "exploration"} 
                onClick={() => onModeChange("exploration")}
                label={t.explore}
              />
              <ModeToggle 
                active={activeMode === "quiz"} 
                onClick={() => onModeChange("quiz")}
                label={t.quiz}
              />
              <ModeToggle 
                active={activeMode === "defi"} 
                onClick={() => onModeChange("defi")}
                label={t.defi}
              />
            </div>
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase px-3 py-1 bg-white/5 rounded-full border border-white/5">
              Lat: 31.7917 / Lon: -7.0926
            </div>
          </div>
        </header>

        {/* Game View */}
        <div className="flex-1 relative min-h-0 container mx-auto p-6 md:p-10 pt-24 md:pt-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full pointer-events-auto flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const ModeToggle = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-6 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300",
      active 
        ? "bg-accent-gold text-bg-deep shadow-lg shadow-accent-gold/20" 
        : "text-text-muted hover:text-text-main hover:bg-white/5"
    )}
  >
    {label}
  </button>
);

const NavIcon = ({ icon, label, active, onClick, isAr }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isAr: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500 border",
      active 
        ? "bg-accent-gold border-accent-gold text-bg-deep shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
        : "bg-transparent border-white/5 text-text-muted hover:border-accent-gold/50 hover:text-accent-gold"
    )}
  >
    {icon}
    <div className={cn(
      "absolute flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300",
      isAr ? "right-14 translate-x-2 group-hover:translate-x-0 flex-row-reverse" : "left-14 -translate-x-2 group-hover:translate-x-0"
    )}>
      <span className="px-3 py-1.5 bg-bg-surface border border-border text-accent-gold text-[9px] font-bold tracking-[0.2em] rounded-lg shadow-2xl whitespace-nowrap">
        {label}
      </span>
    </div>
  </button>
);
