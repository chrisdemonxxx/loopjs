import React, { useState, useEffect } from 'react';
import { FiMapPin, FiUsers, FiGlobe, FiActivity } from 'react-icons/fi';

interface ClientLocation {
  id: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline';
  lastSeen: string;
}

interface MapComponentProps {
  clients: ClientLocation[];
}

const MapComponent: React.FC<MapComponentProps> = ({ clients }) => {
  const [selectedClient, setSelectedClient] = useState<ClientLocation | null>(null);
  const [zoom, setZoom] = useState(2);

  // Calculate map center based on client locations
  useEffect(() => {
    if (clients.length > 0) {
      const onlineClients = clients.filter(client => client.status === 'online');
      if (onlineClients.length === 1) {
        setZoom(6);
      } else if (onlineClients.length > 1) {
        setZoom(4);
      }
    }
  }, [clients]);

  const getClientCountByCountry = () => {
    const countryCount: { [key: string]: number } = {};
    clients.forEach(client => {
      countryCount[client.country] = (countryCount[client.country] || 0) + 1;
    });
    return countryCount;
  };

  const countryCount = getClientCountByCountry();

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-black dark:text-white flex items-center">
          <FiGlobe className="w-5 h-5 mr-2" />
          Client Distribution Map
        </h3>
        <div className="flex items-center space-x-4 text-sm text-bodydark2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Online ({clients.filter(c => c.status === 'online').length})
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            Offline ({clients.filter(c => c.status === 'offline').length})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2">
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg h-80 overflow-hidden">
            {/* World Map Background */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                {/* Simplified world map paths */}
                <path d="M100,200 Q200,150 300,200 Q400,180 500,200 Q600,190 700,200 Q800,210 900,200" 
                      fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"/>
                <path d="M150,300 Q250,280 350,300 Q450,290 550,300 Q650,310 750,300" 
                      fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"/>
                <path d="M200,100 Q300,80 400,100 Q500,90 600,100 Q700,110 800,100" 
                      fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"/>
              </svg>
            </div>

            {/* Client Markers */}
            {clients.map((client) => (
              <div
                key={client.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 ${
                  client.status === 'online' ? 'animate-pulse' : ''
                }`}
                style={{
                  left: `${((client.lng + 180) / 360) * 100}%`,
                  top: `${((90 - client.lat) / 180) * 100}%`
                }}
                onClick={() => setSelectedClient(client)}
              >
                <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                  client.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {client.status === 'online' && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  )}
                </div>
              </div>
            ))}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <button
                onClick={() => setZoom(Math.min(zoom + 1, 10))}
                className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-bold">+</span>
              </button>
              <button
                onClick={() => setZoom(Math.max(zoom - 1, 1))}
                className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-bold">-</span>
              </button>
            </div>

            {/* Zoom Level Display */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-300">
              Zoom: {zoom}x
            </div>
          </div>

          {/* Selected Client Info */}
          {selectedClient && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-black dark:text-white">{selectedClient.name}</h4>
                  <p className="text-sm text-bodydark2">{selectedClient.city}, {selectedClient.country}</p>
                  <p className="text-xs text-bodydark2">Last seen: {selectedClient.lastSeen}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedClient.status === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedClient.status}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Panel */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-black dark:text-white mb-3 flex items-center">
              <FiUsers className="w-4 h-4 mr-2" />
              Client Statistics
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-bodydark2">Total Clients:</span>
                <span className="font-medium text-black dark:text-white">{clients.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-bodydark2">Online:</span>
                <span className="font-medium text-green-600">{clients.filter(c => c.status === 'online').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-bodydark2">Offline:</span>
                <span className="font-medium text-gray-600">{clients.filter(c => c.status === 'offline').length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-black dark:text-white mb-3 flex items-center">
              <FiActivity className="w-4 h-4 mr-2" />
              Top Countries
            </h4>
            <div className="space-y-2">
              {Object.entries(countryCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([country, count]) => (
                  <div key={country} className="flex justify-between text-sm">
                    <span className="text-bodydark2">{country}:</span>
                    <span className="font-medium text-black dark:text-white">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-black dark:text-white mb-3 flex items-center">
              <FiMapPin className="w-4 h-4 mr-2" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {clients
                .filter(c => c.status === 'online')
                .slice(0, 3)
                .map((client) => (
                  <div key={client.id} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-bodydark2">{client.name}</span>
                    <span className="ml-auto text-xs text-bodydark2">{client.country}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
