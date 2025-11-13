import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import LoginPage from '../pages/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ProtectedRoute from './ProtectedRoute';
import { Agent } from '../types';

interface RouterProps {
  isAuthenticated: boolean;
  tableData: Agent[];
  isLoading: boolean;
  onActionClicked: (agent: Agent) => void;
  onTasksClicked: (agent: Agent) => void;
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
        
        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <Layout
                tableData={tableData}
                isLoading={isLoading}
                onActionClicked={onActionClicked}
                onTasksClicked={onTasksClicked}
                onLogout={onLogout}
              />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          } 
        />
        <Route path="/user-management" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout tableData={tableData} isLoading={isLoading} onActionClicked={onActionClicked} onTasksClicked={onTasksClicked} onLogout={onLogout} />
          </ProtectedRoute>
        } />
    </Routes>
  );
};

export default Router;