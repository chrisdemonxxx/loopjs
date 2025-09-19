import React, { useState, useRef } from 'react';
import { Agent } from '../types';

interface WorldMapProps {
  agents: Agent[];
  height?: number;
  onAgentClick?: (agent: Agent) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ agents, height = 200, onAgentClick }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Group agents by country and city
  const locationData = agents.reduce((acc, agent) => {
    const country = agent.geoLocation?.country || 'Unknown';
    const city = agent.geoLocation?.city || 'Unknown';
    const key = `${country}-${city}`;
    
    if (!acc[key]) {
      acc[key] = {
        country,
        city,
        count: 0,
        online: 0,
        offline: 0,
        agents: [],
        coordinates: agent.geoLocation
      };
    }
    
    acc[key].count++;
    acc[key].agents.push(agent);
    
    if (agent.status === 'online') {
      acc[key].online++;
    } else {
      acc[key].offline++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Get coordinates for location (simplified projection)
  const getCoordinates = (location: any) => {
    if (location && location.latitude && location.longitude) {
      // Convert lat/lng to percentage positions (simplified)
      const x = ((location.longitude + 180) / 360) * 100;
      const y = ((90 - location.latitude) / 180) * 100;
      return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
    }
    // Default positions for unknown locations
    return { x: 50, y: 50 };
  };

  return (
    <div 
      className="relative w-full bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-800 rounded-lg border border-blue-500/20 overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="worldMapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#worldMapGrid)" />
        </svg>
      </div>

      {/* Location markers */}
      {Object.entries(locationData).map(([key, data]) => {
        const coords = getCoordinates(data.coordinates);
        const size = Math.max(8, Math.min(24, data.count * 2));
        
        return (
          <div
            key={key}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
            }}
            onClick={() => onAgentClick && data.agents[0] && onAgentClick(data.agents[0])}
          >
            {/* Pulsing effect for online agents */}
            {data.online > 0 && (
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ 
                  width: size, 
                  height: size,
                  backgroundColor: data.online > 0 ? '#3B82F6' : '#6B7280'
                }}
              />
            )}
            
            {/* Main marker */}
            <div
              className="relative rounded-full border-2 border-blue-400/50 shadow-lg transition-all duration-200 group-hover:scale-125 group-hover:border-blue-300"
              style={{ 
                width: size, 
                height: size,
                backgroundColor: data.online > 0 ? '#3B82F6' : '#6B7280',
                boxShadow: data.online > 0 ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 10px rgba(107, 114, 128, 0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {data.count}
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div className="bg-gray-900/95 border border-blue-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-xl">
                <div className="text-blue-400 font-bold">{data.city}, {data.country}</div>
                <div className="text-white">Total: {data.count}</div>
                <div className="text-green-400">Online: {data.online}</div>
                <div className="text-gray-400">Offline: {data.offline}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Scanning animation lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-pulse"></div>
        <div className="absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Corner accent lines */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-500/50"></div>
      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-blue-500/50"></div>
      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-blue-500/50"></div>
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-500/50"></div>
    </div>
  );
};

export default WorldMap;