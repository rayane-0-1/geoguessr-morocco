import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, Camera, Image as ImageIcon, ExternalLink, AlertCircle, Box, Loader2, Clock } from "lucide-react";
import { Monument } from "../../types";
import { calculateDistance, estimateTravelTime } from "../../lib/utils";
import "@google/model-viewer";
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';

const ModelViewerComponent = "model-viewer" as any;

// Sub-component for Mapillary because it needs its own container lifecycle
const MapillaryViewer: React.FC<{ coords: [number, number], token: string }> = ({ coords, token }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        setLoading(true);
        // Step 1: Search for the closest image ID using Mapillary Graph API
        const searchUrl = `https://graph.mapillary.com/images?access_token=${token}&fields=id&closeto=${coords[1]},${coords[0]}&limit=1`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        const imageId = data.data?.[0]?.id;

        if (!imageId) {
          // If no immediate image found, we stay in error state but let the user know we're looking for the nearest tactical point
          setError(true);
          setLoading(false);
          return;
        }

        // Step 2: Initialize the viewer with the found ID
        viewerRef.current = new Viewer({
          accessToken: token,
          container: containerRef.current,
          imageId: imageId,
        });

        viewerRef.current.on('load', () => setLoading(false));
      } catch (err) {
        console.error("Mapillary failed:", err);
        setError(true);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.remove();
      }
    };
  }, [coords, token]);

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/80 backdrop-blur-sm z-10 text-center p-6">
          <Loader2 className="text-accent-gold animate-spin mb-4" size={32} />
          <p className="text-[10px] font-mono text-accent-gold uppercase tracking-[0.3em]">Synchronizing Orbital Feed...</p>
          <p className="text-[8px] text-text-muted mt-2 uppercase tracking-widest">Searching for nearest ground-level data point</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/95 text-center p-12 backdrop-blur-xl">
          <div className="w-20 h-20 mb-8 relative flex items-center justify-center">
            <AlertCircle size={48} className="text-rose-500/40 relative z-10" />
            <motion.div 
              animate={{ rotate: 360, opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-rose-500/20 rounded-full scale-[1.5]"
            />
            <div className="absolute inset-0 bg-rose-500/5 rounded-full blur-2xl" />
          </div>
          
          <h4 className="text-text-main font-display font-bold text-2xl mb-3 tracking-tight">Coverage Gap Detected</h4>
          <p className="text-xs text-text-muted max-w-xs mb-10 leading-relaxed uppercase tracking-widest font-medium opacity-80">
            Current coordinates are outside the localized ground-level scanning radius. No tactical 360° imagery is currently archived for this sector.
          </p>
          
          <a 
            href={`https://www.mapillary.com/app/?lat=${coords[0]}&lng=${coords[1]}&z=14`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-8 py-4 bg-bg-surface border border-white/5 rounded-2xl text-[10px] font-bold tracking-[0.3em] text-accent-gold transition-all hover:bg-white/[0.05] hover:border-accent-gold/50 uppercase"
          >
            Explore Global Archive <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <p className="text-[8px] font-mono text-text-muted uppercase tracking-[0.5em] animate-pulse">Scanning_For_Alternates...</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface MonumentModalProps {
  monument: Monument;
  onClose: () => void;
  onExplored: (id: string) => void;
  isExplored: boolean;
  lang: "ar" | "en";
  userLocation: [number, number] | null;
}

export const MonumentModal: React.FC<MonumentModalProps> = ({ monument, onClose, onExplored, isExplored, lang, userLocation }) => {
  const [viewMode, setViewMode] = useState<"image" | "streetview" | "3d">("image");
  const [prevViewMode, setPrevViewMode] = useState<"image" | "streetview" | "3d">("image");
  const mapillaryToken = import.meta.env.VITE_MAPILLARY_API_KEY;

  const modeOrder = { "image": 0, "streetview": 1, "3d": 2 };
  const direction = modeOrder[viewMode] >= modeOrder[prevViewMode] ? 1 : -1;

  const handleModeChange = (newMode: "image" | "streetview" | "3d") => {
    setPrevViewMode(viewMode);
    setViewMode(newMode);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      scale: 1.02,
      filter: "brightness(1.5) blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "brightness(1) blur(0px)",
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4, ease: "easeOut" },
        scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.3 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      scale: 0.98,
      filter: "brightness(0.8) blur(4px)",
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3, ease: "easeIn" }
      }
    })
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-4xl bg-bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-bg-deep/50 hover:bg-bg-deep/80 rounded-full border border-border z-20 transition-all text-text-muted hover:text-text-main"
        >
          <X size={18} />
        </button>

        {/* Left Side: Visuals */}
        <div className="w-full md:w-3/5 h-[300px] md:h-auto border-r border-border relative bg-black overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            {viewMode === "image" ? (
              <motion.div
                key="image"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full"
              >
                <img 
                  src={monument.imageUrl} 
                  alt={monument.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-bg-surface/20" />
              </motion.div>
            ) : viewMode === "streetview" ? (
              <motion.div
                key="streetview"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full"
              >
                {mapillaryToken ? (
                  <MapillaryViewer coords={monument.coords} token={mapillaryToken} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-bg-deep/90 backdrop-blur-xl select-none">
                    <div className="w-16 h-16 bg-accent-gold/5 rounded-full flex items-center justify-center mb-6 border border-accent-gold/10">
                      <Camera size={32} className="text-accent-gold/40" />
                    </div>
                    <h4 className="text-text-main font-display font-bold text-xl mb-3 tracking-tight uppercase">Access Token Required</h4>
                    <p className="text-xs text-text-muted max-w-xs mb-10 leading-relaxed tracking-wider">
                      Embedded 360° tactical reconnaissance requires an active Mapillary Graph API Key in your environment configuration.
                    </p>
                    <a 
                      href={`https://www.mapillary.com/app/?lat=${monument.coords[0]}&lng=${monument.coords[1]}&z=17`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-8 py-4 bg-accent-gold text-bg-deep rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase transition-all hover:scale-105 shadow-xl shadow-accent-gold/10"
                    >
                      Authenticate On Mapillary <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="3d"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full bg-bg-deep flex flex-col items-center justify-center"
              >
                {monument.modelUrl ? (
                  <ModelViewerComponent
                    src={monument.modelUrl}
                    alt={`Tactical 3D Projection of ${monument.name}`}
                    auto-rotate
                    camera-controls
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    ar-placement="floor"
                    touch-action="pan-y"
                    shadow-intensity="1"
                    environment-image="neutral"
                    style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                  >
                    <div className="absolute top-4 left-4 p-3 bg-accent-gold/5 border border-accent-gold/20 rounded-xl backdrop-blur-md z-10">
                      <p className="text-[9px] font-mono text-accent-gold tracking-widest uppercase mb-1 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-accent-gold animate-ping" />
                        AR_Spatial_Sync_Active
                      </p>
                      <p className="text-[10px] text-text-main font-bold">ACTIVATE AR FEED FOR SPATIAL SCALE</p>
                    </div>

                    <button 
                      slot="ar-button"
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-4 bg-accent-gold text-bg-deep rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase transition-all hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.4)] z-10"
                    >
                      <Box size={16} /> {lang === 'ar' ? "نشر العرض الواقعي" : "Deploy AR Projection"}
                    </button>

                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none opacity-40">
                      <div className="text-[8px] font-mono text-accent-gold uppercase tracking-[0.2em] border-r-2 border-accent-gold px-2">X: 1.024</div>
                      <div className="text-[8px] font-mono text-accent-gold uppercase tracking-[0.2em] border-r-2 border-accent-gold px-2">Y: -0.582</div>
                      <div className="text-[8px] font-mono text-accent-gold uppercase tracking-[0.2em] border-r-2 border-accent-gold px-2">Z: 2.115</div>
                    </div>
                  </ModelViewerComponent>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Box size={40} className="text-accent-gold/20" />
                    <p className="text-xs text-text-muted">3D Spatial Archive Not Found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transition Scanning Effect */}
          <AnimatePresence>
            {viewMode !== prevViewMode && (
              <motion.div 
                key="scanline"
                initial={{ opacity: 0, y: "-100%" }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  y: ["-100%", "100%"] 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "circInOut" }}
                className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
              >
                <div className="w-full h-[20%] bg-gradient-to-b from-transparent via-accent-gold/40 to-transparent blur-xl" />
                <div className="w-full h-[1px] bg-accent-gold shadow-[0_0_15px_#d4af37] absolute top-1/2 left-0" />
                <motion.div 
                  animate={{ opacity: [1, 0.5, 1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.1 }}
                  className="absolute inset-0 bg-accent-gold/[0.03]"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Toggle Controls */}
          <div className="absolute bottom-6 left-6 flex p-1.5 gap-1 z-10 bg-bg-deep/40 backdrop-blur-xl rounded-xl border border-white/5">
            <button 
              onClick={() => handleModeChange("image")}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                ${viewMode === "image" ? "text-bg-deep" : "text-text-muted hover:text-text-main"}`}
            >
              {viewMode === "image" && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-accent-gold rounded-lg shadow-lg shadow-accent-gold/20"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <ImageIcon size={14} /> Gallery
              </span>
            </button>
            <button 
              onClick={() => handleModeChange("streetview")}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                ${viewMode === "streetview" ? "text-bg-deep" : "text-text-muted hover:text-text-main"}`}
            >
              {viewMode === "streetview" && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-accent-gold rounded-lg shadow-lg shadow-accent-gold/20"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Camera size={14} /> 360° View
              </span>
            </button>
            {monument.modelUrl && (
              <button 
                onClick={() => handleModeChange("3d")}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                  ${viewMode === "3d" ? "text-bg-deep" : "text-text-muted hover:text-text-main"}`}
              >
                {viewMode === "3d" && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-accent-gold rounded-lg shadow-lg shadow-accent-gold/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <div className="relative">
                    <Box size={14} />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  </div>
                  3D View
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-2/5 p-10 flex flex-col overflow-y-auto bg-bg-surface/50 backdrop-blur-md">
          <div className="mb-10">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-3"
            >
              <div className="w-1 h-1 rounded-full bg-accent-gold" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-accent-gold uppercase block">
                {monument.cityId} • Terminal_{monument.id.split('-')[0]}
              </span>
            </motion.div>
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-display font-bold text-text-main leading-[0.9] mb-6 tracking-tight flex flex-col gap-2"
            >
              {monument.name}
              {monument.nameAr && (
                <span className="text-2xl font-sans text-accent-gold/40" dir="rtl">
                  {monument.nameAr}
                </span>
              )}
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[13px] text-text-muted leading-relaxed font-light mb-8"
            >
              {monument.description}
            </motion.p>

            <AnimatePresence>
              {monument.history && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl"
                >
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent-gold uppercase mb-3 flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent-gold rounded-full" />
                    Historical Chronicle
                  </h4>
                  <p className="text-[12px] text-text-muted leading-relaxed">
                    {monument.history}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-8 p-6 border-l-2 border-accent-gold/20 bg-accent-gold/[0.01] min-h-[100px]">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent-gold uppercase mb-3 text-left">
                Architectural DNA
              </h4>
              {monument.architecture ? (
                <p className="text-[12px] text-text-muted leading-relaxed italic text-left">
                  {monument.architecture}
                </p>
              ) : (
                <p className="text-[10px] text-text-muted/30 italic font-mono uppercase tracking-widest text-left">
                  {lang === 'ar' ? "جارٍ مسح بيانات العمارة... المخطط الأثري قيد الانتظار." : "Scanning architectural data... Archeological blueprint pending."}
                </p>
              )}
            </div>

            {userLocation && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8 flex items-center gap-4 p-4 border border-accent-gold/10 bg-accent-gold/[0.02] rounded-2xl"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-accent-gold uppercase tracking-widest mb-0.5">Estimated Deployment Time</p>
                  <p className="text-sm font-display font-medium text-text-main">
                    {estimateTravelTime(calculateDistance(userLocation[0], userLocation[1], monument.coords[0], monument.coords[1]))}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mb-10"
          >
            <StatItem label="Classification" value="Historical" />
            <StatItem label="Active Period" value={monument.period || "Undated"} />
          </motion.div>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-auto pt-8 border-t border-white/5"
          >
            <button 
              disabled={isExplored}
              onClick={() => onExplored(monument.id)}
              className={`w-full py-5 rounded-2xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all duration-500
                ${isExplored 
                  ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/20 cursor-default" 
                  : "bg-accent-gold hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] text-bg-deep active:scale-95"}`}
            >
              {isExplored ? "Archive Synced" : "Begin Tactical Analysis"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string, value: string }) => (
  <div className="p-4 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
    <p className="text-[9px] text-text-muted uppercase mb-1.5 tracking-[0.1em] group-hover:text-accent-gold transition-colors">{label}</p>
    <p className="text-sm font-display font-medium text-text-main">{value}</p>
  </div>
);
