import React from 'react';

const TaskManagement: React.FC = () => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-8 text-center">
      <div className="text-4xl mb-4">🧾</div>
      <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Task Management</h2>
      <p className="text-bodydark2">
        The task orchestration queue is being redesigned to integrate AI-assisted retries. Current
        tasks remain accessible from the dashboard.
      </p>
    </div>
  );
};

export default TaskManagement;
