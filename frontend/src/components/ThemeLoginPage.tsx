import React from 'react';
import LoginPage from '../pages/LoginPage';

interface ThemeLoginPageProps {
  onLogin: () => void;
}

const ThemeLoginPage: React.FC<ThemeLoginPageProps> = ({ onLogin }) => {
  return <LoginPage onLogin={onLogin} />;
};

export default ThemeLoginPage;
