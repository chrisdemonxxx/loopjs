import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl text-gray-800">Windows System Management Web Panel</h1>
      <button
        className="bg-red-600 text-white px-4 py-2 rounded"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default Header;
