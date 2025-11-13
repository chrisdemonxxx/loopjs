import { useState, useEffect, useRef } from 'react';
import { MapPin, Globe, Satellite, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ClientLocation {
  id: string;
  city: string;
  country: string;
  count: number;
  lat: number;
  lng: number;
  threat: 'low' | 'medium' | 'high';
}

export default function WorldMapVisualization() {
  const { colors } = useTheme();
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const locations: ClientLocation[] = [
    { id: '1', city: 'New York', country: 'USA', count: 8, lat: 40.7128, lng: -74.0060, threat: 'low' },
    { id: '2', city: 'London', country: 'UK', count: 5, lat: 51.5074, lng: -0.1278, threat: 'medium' },
    { id: '3', city: 'Tokyo', country: 'Japan', count: 12, lat: 35.6762, lng: 139.6503, threat: 'low' },
    { id: '4', city: 'Sydney', country: 'Australia', count: 3, lat: -33.8688, lng: 151.2093, threat: 'low' },
    { id: '5', city: 'Mumbai', country: 'India', count: 6, lat: 19.0760, lng: 72.8777, threat: 'high' },
    { id: '6', city: 'São Paulo', country: 'Brazil', count: 4, lat: -23.5505, lng: -46.6333, threat: 'medium' },
    { id: '7', city: 'Moscow', country: 'Russia', count: 7, lat: 55.7558, lng: 37.6173, threat: 'medium' },
    { id: '8', city: 'Dubai', country: 'UAE', count: 9, lat: 25.2048, lng: 55.2708, threat: 'low' },
  ];

  // Auto-rotate the globe
  useEffect(() => {
    if (viewMode === '3d') {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 0.2) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  // Render 3D globe with enhanced graphics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewMode !== '3d') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const centerX = width / 4;
    const centerY = height / 4;
    const radius = Math.min(width, height) / 5;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw outer glow
    const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.3);
    glowGradient.addColorStop(0, `${colors.primary}30`);
    glowGradient.addColorStop(0.5, `${colors.primary}10`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width / 2, height / 2);

    // Draw main globe with gradient
    const globeGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, 
      centerY - radius * 0.3, 
      radius * 0.1,
      centerX, 
      centerY, 
      radius
    );
    globeGradient.addColorStop(0, `${colors.cardGradientFrom}ff`);
    globeGradient.addColorStop(0.5, `${colors.cardGradientTo}dd`);
    globeGradient.addColorStop(1, `${colors.bgGradientTo}99`);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = globeGradient;
    ctx.fill();

    // Draw globe border with enhanced glow
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors.primary;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw latitude lines (enhanced detail)
    ctx.strokeStyle = `${colors.primary}40`;
    ctx.lineWidth = 0.5;
    for (let lat = -80; lat <= 80; lat += 20) {
      ctx.beginPath();
      const y = centerY + (lat / 90) * radius * 0.9;
      const width = Math.cos((lat * Math.PI) / 180) * radius;
      ctx.ellipse(centerX, y, width, radius * 0.1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw longitude lines (enhanced detail)
    for (let lng = 0; lng < 360; lng += 30) {
      ctx.beginPath();
      const angle = ((lng + rotation) * Math.PI) / 180;
      const x1 = centerX + Math.cos(angle) * radius;
      const x2 = centerX - Math.cos(angle) * radius;
      ctx.ellipse(centerX, centerY, Math.abs(x1 - centerX), radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw continents (simplified high-detail paths)
    ctx.fillStyle = `${colors.primary}30`;
    ctx.strokeStyle = `${colors.primary}60`;
    ctx.lineWidth = 1;
    
    // Function to project 3D coordinates
    const project3D = (lat: number, lng: number) => {
      const adjustedLng = lng + rotation;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (adjustedLng) * (Math.PI / 180);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Simple perspective projection
      const perspective = 600 / (600 + z);
      return {
        x: centerX + x * perspective,
        y: centerY - y * perspective,
        visible: z > -radius * 0.3
      };
    };

    // Draw simplified continents with 3D projection
    const continents = [
      // North America
      [
        [70, -170], [60, -130], [50, -100], [40, -80], [30, -85],
        [25, -100], [20, -105], [15, -90], [25, -80], [35, -75],
        [45, -70], [55, -75], [65, -85], [70, -110], [75, -140]
      ],
      // Europe
      [
        [70, 10], [65, 0], [60, 5], [55, 10], [50, 20],
        [45, 25], [40, 15], [45, 5], [50, 0], [60, -5], [70, 0]
      ],
      // Asia
      [
        [70, 100], [60, 140], [50, 150], [40, 145], [35, 135],
        [30, 120], [25, 110], [35, 105], [45, 100], [55, 90],
        [65, 85], [70, 90]
      ],
      // Africa
      [
        [35, 10], [30, 20], [20, 30], [10, 35], [0, 35],
        [-10, 35], [-20, 30], [-30, 25], [-35, 20], [-30, 15],
        [-20, 10], [-10, 15], [0, 20], [10, 25], [20, 15], [30, 10]
      ],
      // South America
      [
        [10, -80], [0, -75], [-10, -70], [-20, -65], [-30, -60],
        [-40, -65], [-50, -70], [-55, -68], [-50, -73], [-40, -75],
        [-30, -72], [-20, -75], [-10, -78], [0, -80], [10, -82]
      ],
      // Australia
      [
        [-10, 130], [-15, 140], [-20, 145], [-30, 150], [-35, 145],
        [-40, 140], [-35, 135], [-30, 130], [-25, 125], [-20, 120],
        [-15, 125], [-10, 130]
      ]
    ];

    continents.forEach(continent => {
      ctx.beginPath();
      let isFirst = true;
      let allVisible = false;
      
      continent.forEach(([lat, lng]) => {
        const pos = project3D(lat, lng);
        if (pos.visible) {
          allVisible = true;
          if (isFirst) {
            ctx.moveTo(pos.x, pos.y);
            isFirst = false;
          } else {
            ctx.lineTo(pos.x, pos.y);
          }
        }
      });
      
      if (allVisible) {
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw location markers
    locations.forEach(location => {
      const pos = project3D(location.lat, location.lng);
      
      if (pos.visible) {
        const size = 3 + (location.count / 15) * 8;
        const threatColor = 
          location.threat === 'high' ? '#ef4444' :
          location.threat === 'medium' ? '#f59e0b' : colors.primary;

        // Outer pulse ring
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = `${threatColor}40`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow effect
        const markerGlow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 2);
        markerGlow.addColorStop(0, `${threatColor}ff`);
        markerGlow.addColorStop(0.5, `${threatColor}80`);
        markerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = markerGlow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Main marker
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = threatColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = threatColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Center highlight
        ctx.beginPath();
        ctx.arc(pos.x - size * 0.3, pos.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      }
    });

  }, [rotation, viewMode, colors]);

  // Convert lat/lng to 2D coordinates
  const projectToMap = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return colors.primary;
    }
  };

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden backdrop-blur-2xl" 
      style={{
        background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}95, ${colors.cardGradientTo}95)`,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 20px 60px 0 ${colors.glowColor}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)`
      }}>
      
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => setViewMode('3d')}
          className={`px-4 py-2 rounded-lg backdrop-blur-xl transition-all ${
            viewMode === '3d' 
              ? 'text-white' 
              : 'text-slate-400 hover:text-white'
          }`}
          style={{
            background: viewMode === '3d' 
              ? `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
              : `${colors.cardGradientFrom}80`,
            border: `1px solid ${colors.border}`,
            boxShadow: viewMode === '3d' ? `0 0 20px ${colors.glowColor}` : 'none'
          }}
        >
          <Globe className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('2d')}
          className={`px-4 py-2 rounded-lg backdrop-blur-xl transition-all ${
            viewMode === '2d' 
              ? 'text-white' 
              : 'text-slate-400 hover:text-white'
          }`}
          style={{
            background: viewMode === '2d' 
              ? `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
              : `${colors.cardGradientFrom}80`,
            border: `1px solid ${colors.border}`,
            boxShadow: viewMode === '2d' ? `0 0 20px ${colors.glowColor}` : 'none'
          }}
        >
          <Satellite className="h-4 w-4" />
        </button>
      </div>

      {/* 3D View */}
      {viewMode === '3d' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
          />
          
          {/* Ambient particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: colors.primary,
                  opacity: Math.random() * 0.5,
                  animation: `pulse ${2 + Math.random() * 3}s infinite`,
                  boxShadow: `0 0 ${4 + Math.random() * 8}px ${colors.primary}`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2D Flat Map View */}
      {viewMode === '2d' && (
        <div className="relative w-full h-full p-6">
          {/* Grid overlay - High detail */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${colors.primary} 1px, transparent 1px),
                linear-gradient(to bottom, ${colors.primary} 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}
          />

          {/* Detailed SVG Map */}
          <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <linearGradient id="map-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0.2 }} />
              </linearGradient>

              <radialGradient id="marker-glow">
                <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: colors.primary, stopOpacity: 0 }} />
              </radialGradient>
            </defs>

            {/* High-detail continents */}
            {/* North America */}
            <path 
              d="M 180,100 L 195,85 L 220,80 L 245,82 L 270,88 L 290,95 L 305,105 L 315,120 L 320,140 L 322,160 L 318,180 L 310,200 L 298,215 L 282,225 L 265,230 L 250,228 L 235,220 L 225,208 L 218,195 L 215,180 L 210,165 L 205,150 L 200,135 L 195,120 L 188,110 Z M 165,140 L 172,130 L 178,135 L 175,145 L 168,148 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />
            
            {/* South America */}
            <path 
              d="M 275,250 L 285,258 L 292,270 L 298,290 L 302,315 L 305,340 L 306,365 L 304,385 L 298,402 L 288,415 L 275,422 L 262,425 L 250,422 L 242,412 L 238,398 L 235,380 L 232,360 L 230,340 L 228,320 L 230,300 L 235,285 L 245,270 L 258,260 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />
            
            {/* Europe */}
            <path 
              d="M 575,105 L 595,98 L 615,100 L 630,108 L 638,118 L 643,130 L 645,143 L 642,155 L 635,165 L 622,172 L 608,175 L 595,173 L 582,168 L 572,158 L 568,145 L 570,132 L 575,120 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />
            
            {/* Africa */}
            <path 
              d="M 585,185 L 605,192 L 622,205 L 635,225 L 645,250 L 652,275 L 655,300 L 653,325 L 645,350 L 632,370 L 615,385 L 595,395 L 575,398 L 558,395 L 545,385 L 538,370 L 535,350 L 533,325 L 535,300 L 540,275 L 548,250 L 558,225 L 568,205 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />
            
            {/* Asia */}
            <path 
              d="M 660,85 L 700,78 L 740,82 L 780,92 L 820,105 L 855,118 L 880,132 L 900,148 L 912,168 L 918,188 L 915,208 L 905,228 L 885,245 L 860,258 L 830,268 L 795,275 L 760,278 L 725,275 L 695,265 L 672,250 L 658,230 L 652,208 L 650,185 L 652,162 L 656,138 L 660,115 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />
            
            {/* Australia */}
            <path 
              d="M 900,350 L 925,345 L 950,348 L 972,358 L 988,372 L 998,390 L 1002,410 L 996,428 L 982,443 L 962,452 L 938,456 L 915,452 L 895,442 L 882,428 L 878,410 L 880,390 L 888,372 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />

            {/* Greenland */}
            <path 
              d="M 395,48 L 415,42 L 435,45 L 448,55 L 455,68 L 455,85 L 448,98 L 435,108 L 415,112 L 398,108 L 385,98 L 380,85 L 382,68 Z"
              fill="url(#map-gradient)"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
              filter="url(#glow-filter)"
              className="transition-all hover:opacity-70 cursor-pointer"
            />

            {/* Connection lines */}
            {locations.map((loc, index) => {
              if (index === 0) return null;
              const prevLoc = locations[index - 1];
              const start = projectToMap(prevLoc.lat, prevLoc.lng);
              const end = projectToMap(loc.lat, loc.lng);
              
              return (
                <line
                  key={`line-${loc.id}`}
                  x1={start.x * 12}
                  y1={start.y * 6}
                  x2={end.x * 12}
                  y2={end.y * 6}
                  stroke={colors.primary}
                  strokeWidth="1.5"
                  opacity="0.3"
                  strokeDasharray="6,6"
                  className="animate-pulse"
                />
              );
            })}

            {/* Location markers */}
            {locations.map((location) => {
              const pos = projectToMap(location.lat, location.lng);
              const isActive = activeLocation === location.id;
              const size = 6 + (location.count / 15) * 15;
              const threatColor = getThreatColor(location.threat);
              
              return (
                <g 
                  key={location.id}
                  onMouseEnter={() => setActiveLocation(location.id)}
                  onMouseLeave={() => setActiveLocation(null)}
                  className="cursor-pointer"
                >
                  {/* Outer pulse ring */}
                  <circle
                    cx={pos.x * 12}
                    cy={pos.y * 6}
                    r={size * 3}
                    fill="none"
                    stroke={threatColor}
                    strokeWidth="2"
                    opacity={isActive ? 0.8 : 0.4}
                    className="animate-pulse"
                  />
                  
                  {/* Middle glow */}
                  <circle
                    cx={pos.x * 12}
                    cy={pos.y * 6}
                    r={size * 2}
                    fill={threatColor}
                    opacity={isActive ? 0.4 : 0.2}
                    filter="url(#glow-filter)"
                  />
                  
                  {/* Inner glow */}
                  <circle
                    cx={pos.x * 12}
                    cy={pos.y * 6}
                    r={size * 1.5}
                    fill={threatColor}
                    opacity={isActive ? 0.7 : 0.4}
                    filter="url(#glow-filter)"
                  />
                  
                  {/* Main marker */}
                  <circle
                    cx={pos.x * 12}
                    cy={pos.y * 6}
                    r={size}
                    fill={threatColor}
                    opacity={isActive ? 1 : 0.95}
                    className="transition-all"
                    style={{
                      filter: `drop-shadow(0 0 ${isActive ? 16 : 10}px ${threatColor})`
                    }}
                  />
                  
                  {/* Center highlight */}
                  <circle
                    cx={pos.x * 12 - size * 0.3}
                    cy={pos.y * 6 - size * 0.3}
                    r={size * 0.4}
                    fill="rgba(255, 255, 255, 0.7)"
                    opacity={isActive ? 1 : 0.6}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltips */}
          {locations.map((location) => {
            const pos = projectToMap(location.lat, location.lng);
            const isActive = activeLocation === location.id;
            
            if (!isActive) return null;
            
            return (
              <div
                key={`tooltip-${location.id}`}
                className="absolute pointer-events-none z-50 animate-in fade-in zoom-in duration-200"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -140%)',
                }}
              >
                <div className="backdrop-blur-xl rounded-xl p-4 shadow-2xl"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 20px 60px ${colors.glowColor}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)`
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" style={{ color: getThreatColor(location.threat) }} />
                    <span className="text-slate-100">{location.city}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{location.country}</p>
                  <div className="flex items-center justify-between gap-4 pt-2 border-t" style={{ borderColor: colors.border }}>
                    <div>
                      <span className="text-2xl bg-gradient-to-r bg-clip-text text-transparent" style={{
                        backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`
                      }}>
                        {location.count}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">clients</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      location.threat === 'high' ? 'bg-red-500/20 text-red-400' :
                      location.threat === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {location.threat.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Panel */}
      <div className="absolute bottom-4 right-4 backdrop-blur-xl rounded-xl p-4 z-20"
        style={{
          background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}e5, ${colors.cardGradientTo}e5)`,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 8px 32px ${colors.glowColor}`
        }}>
        <h4 className="text-xs text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp className="h-3 w-3" style={{ color: colors.primary }} />
          Top Locations
        </h4>
        <div className="space-y-2">
          {locations
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map((location) => (
              <div key={location.id} className="flex items-center justify-between gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: getThreatColor(location.threat), 
                      boxShadow: `0 0 10px ${getThreatColor(location.threat)}` 
                    }}
                  />
                  <span className="text-slate-300">{location.city}</span>
                </div>
                <span style={{ color: colors.primary }}>{location.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Info Badge */}
      <div className="absolute top-4 right-4 backdrop-blur-xl rounded-lg px-3 py-2 text-xs text-slate-300 z-20"
        style={{
          background: `${colors.cardGradientFrom}c0`,
          border: `1px solid ${colors.border}`
        }}>
        {viewMode === '3d' ? '3D Globe View' : 'Flat Map View'} • {locations.reduce((sum, loc) => sum + loc.count, 0)} Active Clients
      </div>
    </div>
  );
}
