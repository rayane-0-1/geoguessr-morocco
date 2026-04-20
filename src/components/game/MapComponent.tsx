import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Monument, City } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface MapComponentProps {
  monuments: Monument[];
  cities: City[];
  onMonumentSelect?: (monument: Monument) => void;
  onMapClick?: (coords: [number, number]) => void;
  selectedId?: string;
  customCenter?: [number, number] | null;
  unlockedIds?: string[];
  justUnlockedId?: string | null;
  hideMarkers?: boolean;
  guessCoords?: [number, number] | null;
  targetCoords?: [number, number] | null;
  showResult?: boolean;
  userLocation: [number, number] | null;
  lang?: "ar" | "en";
}

// Resizer to handle container changes and capture map instance
const MapResizer = ({ onMapInstance }: { onMapInstance?: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    onMapInstance?.(map);
    // Initial invalidate
    map.invalidateSize();
    
    // Invalidate size after a delay to ensure parent container layout is stable
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [map, onMapInstance]);
  return null;
};

// Event handler for map clicks
const MapEvents = ({ onMapClick }: { onMapClick?: (coords: [number, number]) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// Controller to handle zooming smoothly and fitting bounds
const MapController = ({ center, bounds }: { center?: [number, number], bounds?: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, 7, { 
        duration: 1.5,
        easeLinearity: 0.25,
        noMoveStart: true
      });
    }
  }, [center?.[0], center?.[1], bounds, map]); 
  return null;
};

// Subtle parallax effect overlay
const ParallaxOverlay = () => {
  const map = useMap();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useMapEvents({
    move: () => {
      const center = map.getCenter();
      // Calculate a subtle offset based on geographic coordinates
      setOffset({
        x: (center.lng * 20) % 50,
        y: (center.lat * 20) % 50
      });
    }
  });

  return (
    <div 
      className="map-grid-overlay" 
      style={{ 
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.1s ease-out'
      }} 
    />
  );
};

export const MapComponent: React.FC<MapComponentProps> = ({ 
  monuments, 
  cities,
  onMonumentSelect, 
  onMapClick,
  selectedId,
  customCenter,
  unlockedIds = [],
  justUnlockedId,
  hideMarkers = false,
  guessCoords,
  targetCoords,
  showResult = false,
  userLocation,
  lang
}) => {
  const isAr = lang === "ar";
  const t = {
    operatorPos: isAr ? "موقع المشغل" : "Operator Position",
    yourGuess: isAr ? "تخمينك" : "Your Guess",
    actualLoc: isAr ? "الموقع الفعلي" : "Actual Location",
    waypoint: isAr ? "نقطة_مسار" : "WAYPOINT",
    cityNode: isAr ? "عقدة_مدينة" : "CITY_NODE",
    objIdentified: isAr ? "تم_تحديد_الهدف" : "OBJ_IDENTIFIED",
    scanPending: isAr ? "انتظار_المسح" : "SCAN_PENDING",
    atlasConsole: isAr ? "وحدة تحكم أطلس" : "Atlas Console",
    sector: isAr ? "القطاع: شمال إفريقيا / 04" : "Sector: North Africa / 04",
    optics: isAr ? "البصريات: قمر_صناعي_قياسي" : "Optics: Satellite_Standard",
    statusOp: isAr ? "الحالة: تشغيلي" : "Status: Operational",
    routeTelemetry: isAr ? "عن بعد للمسار" : "Route Telemetry",
    distance: isAr ? "المسافة" : "Distance",
    estTransit: isAr ? "الوقت المتوقع" : "Est. Transit",
    disconnect: isAr ? "[ فصل_المسار ]" : "[ DISCONNECT_ROUTE ]",
    calculating: isAr ? "جاري حساب المسار..." : "Calculating Path...",
    routeInitiated: isAr ? "بدء_المسار_التكتيكي" : "Tactical_Route_Initiated",
    originPoint: isAr ? "نقطة الأصل:" : "Origin Point:",
    selectDest: isAr ? "حدد الوجهة التالية على الخريطة" : "SELECT DESTINATION NODE ON MAP",
    abort: isAr ? "إلغاء الاتصال" : "Abort Connection"
  };

  const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];
  const [map, setMap] = useState<L.Map | null>(null);
  const [routeSelection, setRouteSelection] = useState<(Monument | City)[]>([]);
  const [activeRoutePath, setActiveRoutePath] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Tactical Routing Logic
  useEffect(() => {
    if (routeSelection.length === 2) {
      const fetchTacticalRoute = async () => {
        setIsRouting(true);
        const [p1, p2] = routeSelection;
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${p1.coords[1]},${p1.coords[0]};${p2.coords[1]},${p2.coords[0]}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            setActiveRoutePath(coords as [number, number][]);
            setRouteInfo({
              distance: data.routes[0].distance / 1000,
              duration: data.routes[0].duration / 60
            });
          } else {
            // Fallback to vector line
            setActiveRoutePath([p1.coords, p2.coords]);
          }
        } catch (error) {
          console.error("Tactical Routing Failed:", error);
          setActiveRoutePath([p1.coords, p2.coords]);
        } finally {
          setIsRouting(false);
        }
      };
      fetchTacticalRoute();
    } else {
      setActiveRoutePath(null);
      setRouteInfo(null);
    }
  }, [routeSelection]);

  const handlePointSelection = (item: Monument | City) => {
    setRouteSelection(prev => {
      // If we click an already selected point, clear selection
      if (prev.find(p => p.id === item.id)) {
        return [];
      }
      
      if (prev.length === 0) {
        return [item];
      }
      
      if (prev.length === 1) {
        return [prev[0], item];
      }
      
      // If we already have 2, start a new one from the last one or just start fresh
      // User intent: clicking a 3rd should probably start a new leg or reset
      return [item];
    });
  };

  // Custom marker icons memoized to prevent re-creation glitches
  const activeIcon = useMemo(() => L.divIcon({
    className: 'map-marker map-marker-active',
    html: '<div class="marker-pulse"></div><div class="marker-hex"><div class="marker-core"></div></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  }), []);

  const normalIcon = useMemo(() => L.divIcon({
    className: 'map-marker',
    html: '<div class="marker-hex"><div class="marker-core"></div></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  }), []);

  const unlockedIcon = useMemo(() => L.divIcon({
    className: 'map-marker map-marker-unlocked',
    html: '<div class="marker-hex"><div class="marker-core"></div></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  }), []);

  const cityIcon = useMemo(() => L.divIcon({
    className: 'map-marker map-marker-city',
    html: '<div class="city-marker-container"><div class="city-ring"></div><div class="marker-hex"><div class="marker-core"></div></div></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  }), []);

  const celebrateIcon = useMemo(() => L.divIcon({
    className: 'map-marker map-marker-just-unlocked',
    html: '<div class="marker-pulse"></div><div class="marker-pulse-slow"></div><div class="marker-hex"><div class="marker-core"></div></div><div class="marker-label-new">SYNC</div>',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  }), []);

  const userIcon = useMemo(() => L.divIcon({
    className: 'map-marker user-location-marker',
    html: '<div class="user-marker-container"><div class="user-ping"></div><div class="user-ping-secondary"></div><div class="user-core"></div></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  }), []);

  const guessIcon = useMemo(() => L.divIcon({
    className: 'map-marker guess-marker',
    html: '<div class="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-center animate-bounce"><div class="w-2 h-2 bg-white rounded-full" /></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }), []);

  const resultBounds = useMemo(() => {
    if (showResult && guessCoords && targetCoords) {
      return L.latLngBounds([guessCoords, targetCoords]);
    }
    return undefined;
  }, [showResult, guessCoords, targetCoords]);

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-border bg-bg-deep shadow-2xl min-h-[400px] pointer-events-auto">
      <MapContainer 
        center={MOROCCO_CENTER} 
        zoom={6} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <MapResizer onMapInstance={setMap} />
        <MapEvents onMapClick={onMapClick} />
        
        {/* Dark Themed Map Layer - Using a more standard CartoDB URL */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          updateWhenIdle={true}
          keepBuffer={3}
        />
        
        <ParallaxOverlay />
        
        <ZoomControl position="bottomright" />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
             <Tooltip direction="top" className="custom-map-tooltip">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{t.operatorPos}</span>
              </Tooltip>
          </Marker>
        )}

        {showResult && guessCoords && targetCoords && (
          <>
            <Marker position={guessCoords} icon={guessIcon} alt={t.yourGuess}>
              <Tooltip permanent direction="top" className="custom-map-tooltip !bg-rose-500/20 !border-rose-500/40">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t.yourGuess}</span>
              </Tooltip>
            </Marker>
            <Marker position={targetCoords} icon={activeIcon} alt={t.actualLoc}>
               <Tooltip permanent direction="top" className="custom-map-tooltip">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">{t.actualLoc}</span>
              </Tooltip>
            </Marker>
            <Polyline 
              positions={[guessCoords, targetCoords]} 
              pathOptions={{ 
                color: '#d4af37', 
                weight: 2, 
                dashArray: '10, 10',
                opacity: 0.6
              }} 
            />
          </>
        )}

        {/* Cities Layer */}
        {!hideMarkers && !showResult && cities.map((city) => {
          const routeIndex = routeSelection.findIndex(p => p.id === city.id);
          const isSelectedInRoute = routeIndex !== -1;
          
          return (
            <Marker
              key={city.id}
              position={city.coords}
              icon={isSelectedInRoute ? activeIcon : cityIcon}
              eventHandlers={{
                click: () => handlePointSelection(city)
              }}
            >
              <Tooltip permanent={isSelectedInRoute} direction="top" className={cn("custom-map-tooltip", isSelectedInRoute && "active-waypoint-tooltip")}>
                <div className="flex flex-col gap-1 p-1">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", isSelectedInRoute ? "text-accent-gold animate-pulse" : "text-cyan-400")}>
                    {isSelectedInRoute ? `${t.waypoint}_0${routeIndex + 1}` : t.cityNode}
                  </span>
                  <span className="text-sm font-display font-medium text-white">{isAr && city.nameAr ? city.nameAr : city.name}</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {!hideMarkers && !showResult && monuments.map((monument) => {
          const isSelected = selectedId === monument.id;
          const routeIndex = routeSelection.findIndex(p => p.id === monument.id);
          const isSelectedInRoute = routeIndex !== -1;
          const isJustUnlocked = justUnlockedId === monument.id;
          const isUnlocked = unlockedIds.includes(monument.id);

          let icon = normalIcon;
          if (isSelected || isSelectedInRoute) icon = activeIcon;
          if (isUnlocked) icon = unlockedIcon;
          if (isJustUnlocked) icon = celebrateIcon;

          return (
            <Marker 
              key={monument.id} 
              position={monument.coords}
              icon={icon}
              alt={`Tactical Monument: ${monument.name}`}
              eventHandlers={{
                click: (e) => {
                  // Apply transient click effect class
                  const iconElement = e.target.getElement();
                  if (iconElement) {
                    iconElement.classList.add('marker-clicked');
                    setTimeout(() => {
                      iconElement.classList.remove('marker-clicked');
                    }, 600); // Matches animation duration
                  }
                  
                  // Handle selective routing
                  handlePointSelection(monument);
                  
                  // Stabilized selection handler
                  onMonumentSelect?.(monument);
                }
              }}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                permanent={isSelectedInRoute}
                className={cn("custom-map-tooltip", isSelectedInRoute && "active-waypoint-tooltip")}
              >
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <div className="flex justify-between items-start border-b border-white/10 pb-1">
                    <span className={cn("tech-label", isSelectedInRoute && "text-accent-gold animate-pulse")}>
                      {isSelectedInRoute ? `${t.waypoint}_0${routeIndex + 1}` : (isUnlocked ? t.objIdentified : t.scanPending)}
                    </span>
                    <span className="tech-label opacity-30">REF_{monument.id.slice(0,4)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-display font-medium text-text-main leading-tight flex items-center justify-between gap-2">
                      {isAr && monument.nameAr ? monument.nameAr : monument.name}
                    </span>
                    <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5", isSelectedInRoute ? "text-accent-gold" : "text-accent-gold")}>
                      <div className={cn("w-1 h-1 rounded-full animate-pulse", isSelectedInRoute ? "bg-accent-gold shadow-[0_0_8px_#d4af37]" : "bg-accent-gold")} />
                      GPS_LOG: {monument.coords[0].toFixed(5)}°N, {monument.coords[1].toFixed(5)}°W
                    </span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {activeRoutePath && (
          <>
            <Polyline 
              positions={activeRoutePath}
              pathOptions={{
                color: '#d4af37',
                weight: 4,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'tactical-route-glow'
              }}
            />
            <Polyline 
              positions={activeRoutePath}
              pathOptions={{
                color: '#fff',
                weight: 1,
                opacity: 0.4,
                dashArray: '5, 10',
                className: 'tactical-route-dash'
              }}
            />
          </>
        )}

        {selectedId && !showResult && (
          <MapController 
            center={monuments.find(m => m.id === selectedId)?.coords || MOROCCO_CENTER} 
          />
        )}

        {customCenter && !selectedId && !showResult && (
          <MapController center={customCenter} />
        )}

        {!selectedId && !customCenter && !showResult && (
          <MapController center={MOROCCO_CENTER} />
        )}

        {showResult && (
          <MapController bounds={resultBounds} />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className={cn("absolute top-[120px] p-5 hud-glass rounded-2xl z-10 pointer-events-none shadow-2xl flex flex-col gap-2", isAr ? "right-6" : "left-6")}>
        <div className={cn("flex items-center gap-2 mb-1", isAr && "flex-row-reverse")}>
          <div className="w-1 h-1 rounded-full bg-accent-gold animate-pulse" />
          <h3 className="text-[10px] font-bold tracking-[0.3em] text-accent-gold uppercase">{t.atlasConsole}</h3>
        </div>
        <div className={cn("flex flex-col gap-1 border-white/10 pr-3", isAr ? "border-r pr-3 items-end text-right" : "border-l pl-3")}>
          <p className="text-[9px] text-text-muted font-mono uppercase tracking-tighter">{t.sector}</p>
          <p className="text-[9px] text-text-muted font-mono uppercase tracking-tighter">{t.optics}</p>
          <p className="text-[9px] text-accent-gold/80 font-mono tracking-widest uppercase mt-1">{t.statusOp}</p>
        </div>
        
        {routeInfo && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className={cn("flex items-center gap-2", isAr && "flex-row-reverse")}>
              <div className="w-1.5 h-1.5 bg-accent-gold rounded-full shadow-[0_0_8px_#d4af37]" />
              <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">{t.routeTelemetry}</span>
            </div>
            <div className={cn("grid grid-cols-1 gap-1", isAr ? "border-r pr-3" : "border-l pl-3", "border-accent-gold/20")}>
              <div className={cn("flex justify-between items-center gap-4", isAr && "flex-row-reverse")}>
                <span className="text-[9px] text-text-muted uppercase font-mono">{t.distance}</span>
                <span className="text-xs text-white font-mono">{routeInfo.distance.toFixed(1)} km</span>
              </div>
              <div className={cn("flex justify-between items-center gap-4", isAr && "flex-row-reverse")}>
                <span className="text-[9px] text-text-muted uppercase font-mono">{t.estTransit}</span>
                <span className="text-xs text-white font-mono">{Math.floor(routeInfo.duration)} min</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setRouteSelection([]);
                }}
                className={cn("mt-2 text-[8px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors pointer-events-auto", isAr ? "text-right" : "text-left")}
              >
                {t.disconnect}
              </button>
            </div>
          </div>
        )}

        {isRouting && (
          <div className={cn("mt-4 flex items-center gap-2", isAr ? "pr-3 flex-row-reverse" : "pl-3")}>
            <div className="w-2 h-2 border-t-2 border-accent-gold rounded-full animate-spin" />
            <span className="text-[9px] text-accent-gold/60 uppercase font-mono animate-pulse">{t.calculating}</span>
          </div>
        )}
      </div>

      {/* Routing Prompt Tooltip */}
      <AnimatePresence>
        {routeSelection.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="absolute bottom-10 md:bottom-24 left-1/2 z-[1000] pointer-events-auto"
          >
            <div className="bg-bg-deep/90 backdrop-blur-2xl border border-accent-gold/50 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2 min-w-[280px]">
              <div className="hud-bracket hud-bracket-tl" />
              <div className="hud-bracket hud-bracket-tr" />
              <div className="hud-bracket hud-bracket-bl" />
              <div className="hud-bracket hud-bracket-br" />
              
              <div className={cn("flex items-center gap-2 mb-1", isAr && "flex-row-reverse text-right")}>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-ping" />
                <span className="text-[9px] font-bold text-accent-gold tracking-[0.4em] uppercase">{t.routeInitiated}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-text-muted uppercase tracking-tighter opacity-60 mb-1">{t.originPoint}</span>
                <span className="text-base font-display font-medium text-white uppercase tracking-tight">
                  {isAr && routeSelection[0].nameAr ? routeSelection[0].nameAr : routeSelection[0].name}
                </span>
              </div>

              <div className="w-full h-[1px] bg-white/5 my-1" />

              <span className="text-[10px] text-accent-gold font-mono animate-pulse tracking-wide text-center">
                {t.selectDest}
              </span>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setRouteSelection([]);
                }}
                className="mt-2 px-4 py-1.5 border border-white/10 rounded-lg text-[8px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center gap-2 group"
              >
                {t.abort}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
