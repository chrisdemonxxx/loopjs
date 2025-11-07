import React from 'react';

const UserManagement: React.FC = () => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-8 text-center">
      <div className="text-4xl mb-4">👥</div>
      <h2 className="text-xl font-semibold text-black dark:text-white mb-2">User Management</h2>
      <p className="text-bodydark2 max-w-2xl mx-auto">
        Enhanced operator and viewer management, including role-based access control and audit trails,
        is part of the upcoming governance release. Existing administrator accounts remain fully
        functional.
      </p>
    </div>
  );
};

export default UserManagement;
