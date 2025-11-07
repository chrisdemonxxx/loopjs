import React from 'react';

const WorldMap: React.FC = () => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-8 text-center">
      <div className="text-4xl mb-4">🗺️</div>
      <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Global Activity</h2>
      <p className="text-bodydark2 max-w-2xl mx-auto">
        Interactive geo-visualisation is moving to the new telemetry service. The map will return
        once the streaming API is stabilised.
      </p>
    </div>
  );
};

export default WorldMap;
