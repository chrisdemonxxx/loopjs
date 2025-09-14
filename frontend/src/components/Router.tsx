import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import LoginPage from '../pages/LoginPage';
import { User } from '../types';

interface RouterProps {
  isAuthenticated: boolean;
  tableData: User[];
  isLoading: boolean;
  onActionClicked: (user: User) => void;
  onTasksClicked: (user: User) => void;
  onLogout: () => void;
  onLogin: () => void;
}

const Router: React.FC<RouterProps> = ({
  isAuthenticated,
  tableData,
  isLoading,
  onActionClicked,
  onTasksClicked,
  onLogout,
  onLogin
}) => {
  return (
    <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <LoginPage onLogin={onLogin} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <Layout
                tableData={tableData}
                isLoading={isLoading}
                onActionClicked={onActionClicked}
                onTasksClicked={onTasksClicked}
                onLogout={onLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          } 
        />
    </Routes>
  );
};

export default Router;