import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import hvncService from '../services/hvncService';

interface HvncSession {
  sessionId: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  quality: string;
  fps: number;
  error?: string;
  screenInfo?: {
    width: number;
    height: number;
  };
}

interface HvncContextType {
  session: HvncSession;
  startSession: (agentId: string, quality: string, fps: number) => Promise<void>;
  stopSession: (agentId: string) => Promise<void>;
  sendCommand: (agentId: string, command: string, params: any) => Promise<void>;
  takeScreenshot: (agentId: string) => Promise<void>;
  updateSessionStatus: (status: HvncSession['status'], error?: string) => void;
  updateScreenInfo: (screenInfo: HvncSession['screenInfo']) => void;
}

const HvncContext = createContext<HvncContextType | undefined>(undefined);

export const useHvnc = () => {
  const context = useContext(HvncContext);
  if (!context) {
    throw new Error('useHvnc must be used within HvncProvider');
  }
  return context;
};

interface HvncProviderProps {
  children: ReactNode;
  agentId: string;
}

export const HvncProvider: React.FC<HvncProviderProps> = ({ children, agentId }) => {
  const [session, setSession] = useState<HvncSession>({
    sessionId: null,
    status: 'disconnected',
    quality: 'medium',
    fps: 15
  });

  const startSession = useCallback(async (agentId: string, quality: string, fps: number) => {
    try {
      setSession(prev => ({ ...prev, status: 'connecting' }));
      const response = await hvncService.startSession(agentId, { quality, mode: 'hidden' });
      
      if (response.status === 'success' && response.data.sessionId) {
        setSession({
          sessionId: response.data.sessionId,
          status: 'connected',
          quality,
          fps: parseInt(fps.toString())
        });
      } else {
        throw new Error('Failed to start session');
      }
    } catch (error: any) {
      setSession(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Failed to start HVNC session'
      }));
      throw error;
    }
  }, []);

  const stopSession = useCallback(async (agentId: string) => {
    if (!session.sessionId) return;
    
    try {
      await hvncService.stopSession(agentId, session.sessionId);
      setSession({
        sessionId: null,
        status: 'disconnected',
        quality: session.quality,
        fps: session.fps
      });
    } catch (error: any) {
      setSession(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Failed to stop HVNC session'
      }));
      throw error;
    }
  }, [session.sessionId, session.quality, session.fps]);

  const sendCommand = useCallback(async (agentId: string, command: string, params: any) => {
    if (!session.sessionId) {
      throw new Error('No active session');
    }
    
    try {
      await hvncService.sendCommand(agentId, session.sessionId, { command, params });
    } catch (error: any) {
      throw error;
    }
  }, [session.sessionId]);

  const takeScreenshot = useCallback(async (agentId: string) => {
    if (!session.sessionId) {
      throw new Error('No active session');
    }
    
    try {
      await hvncService.takeScreenshot(agentId, session.sessionId);
    } catch (error: any) {
      throw error;
    }
  }, [session.sessionId]);

  const updateSessionStatus = useCallback((status: HvncSession['status'], error?: string) => {
    setSession(prev => ({ ...prev, status, error }));
  }, []);

  const updateScreenInfo = useCallback((screenInfo: HvncSession['screenInfo']) => {
    setSession(prev => ({ ...prev, screenInfo }));
  }, []);

  const value: HvncContextType = {
    session,
    startSession,
    stopSession,
    sendCommand,
    takeScreenshot,
    updateSessionStatus,
    updateScreenInfo
  };

  return <HvncContext.Provider value={value}>{children}</HvncContext.Provider>;
};
