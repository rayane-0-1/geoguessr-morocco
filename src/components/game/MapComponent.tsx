import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Monument, City } from "../../types";

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
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Operator Position</span>
              </Tooltip>
          </Marker>
        )}

        {showResult && guessCoords && targetCoords && (
          <>
            <Marker position={guessCoords} icon={guessIcon} alt="Your Guess Location">
              <Tooltip permanent direction="top" className="custom-map-tooltip !bg-rose-500/20 !border-rose-500/40">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Your Guess</span>
              </Tooltip>
            </Marker>
            <Marker position={targetCoords} icon={activeIcon} alt="Actual Monument Location">
               <Tooltip permanent direction="top" className="custom-map-tooltip">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">Actual Location</span>
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
          const isSelectedInRoute = routeSelection.find(p => p.id === city.id);
          
          return (
            <Marker
              key={city.id}
              position={city.coords}
              icon={isSelectedInRoute ? activeIcon : cityIcon}
              eventHandlers={{
                click: () => handlePointSelection(city)
              }}
            >
              <Tooltip direction="top" className="custom-map-tooltip">
                <div className="flex flex-col gap-1 p-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">CITY_NODE</span>
                  <span className="text-sm font-display font-medium text-white">{lang === 'ar' ? city.nameAr : city.name}</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {!hideMarkers && !showResult && monuments.map((monument) => {
          const isSelected = selectedId === monument.id;
          const isSelectedInRoute = routeSelection.find(p => p.id === monument.id);
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
                permanent={false}
                className="custom-map-tooltip"
              >
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <div className="flex justify-between items-start border-b border-white/10 pb-1">
                    <span className="tech-label">
                      {isUnlocked ? 'OBJ_IDENTIFIED' : 'SCAN_PENDING'}
                    </span>
                    <span className="tech-label opacity-30">REF_{monument.id.slice(0,4)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-display font-medium text-text-main leading-tight flex items-center justify-between gap-2">
                      {monument.name}
                      {monument.nameAr && (
                        <span className="text-xs font-sans text-accent-gold" dir="rtl">
                          {monument.nameAr}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-accent-gold font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-accent-gold rounded-full animate-pulse" />
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
      <div className="absolute top-[120px] left-6 p-5 hud-glass rounded-2xl z-10 pointer-events-none shadow-2xl flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-1 rounded-full bg-accent-gold animate-pulse" />
          <h3 className="text-[10px] font-bold tracking-[0.3em] text-accent-gold uppercase">Atlas Console</h3>
        </div>
        <div className="flex flex-col gap-1 border-l border-white/10 pl-3">
          <p className="text-[9px] text-text-muted font-mono uppercase tracking-tighter">Sector: North Africa / 04</p>
          <p className="text-[9px] text-text-muted font-mono uppercase tracking-tighter">Optics: Satellite_Standard</p>
          <p className="text-[9px] text-accent-gold/80 font-mono tracking-widest uppercase mt-1">Status: Operational</p>
        </div>
        
        {routeInfo && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-gold rounded-full shadow-[0_0_8px_#d4af37]" />
              <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">Route Telemetry</span>
            </div>
            <div className="grid grid-cols-1 gap-1 pl-3 border-l border-accent-gold/20">
              <div className="flex justify-between items-center gap-4">
                <span className="text-[9px] text-text-muted uppercase font-mono">Distance</span>
                <span className="text-xs text-white font-mono">{routeInfo.distance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[9px] text-text-muted uppercase font-mono">Est. Transit</span>
                <span className="text-xs text-white font-mono">{Math.floor(routeInfo.duration)} min</span>
              </div>
            </div>
          </div>
        )}

        {isRouting && (
          <div className="mt-4 flex items-center gap-2 pl-3">
            <div className="w-2 h-2 border-t-2 border-accent-gold rounded-full animate-spin" />
            <span className="text-[9px] text-accent-gold/60 uppercase font-mono animate-pulse">Calculating Path...</span>
          </div>
        )}
      </div>
    </div>
  );
};
