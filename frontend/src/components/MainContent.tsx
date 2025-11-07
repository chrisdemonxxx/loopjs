import React from 'react';

const MainContent: React.FC = () => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-8 text-center">
      <div className="text-4xl mb-4">🗂️</div>
      <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Legacy Layout</h2>
      <p className="text-bodydark2">
        This placeholder remains for backward compatibility with the original TailAdmin layout.
        The new dashboard experience handles navigation and routing directly.
      </p>
    </div>
  );
};

export default MainContent;
