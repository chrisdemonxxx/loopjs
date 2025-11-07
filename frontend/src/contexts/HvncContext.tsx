import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import hvncService, { HvncSessionOptions, HvncSessionResponse, HvncStopResponse } from '../services/hvncService';

export type HvncConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'starting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface HvncFramePayload {
  frameData: string;
  frameInfo?: {
    width?: number;
    height?: number;
    format?: string;
  };
  timestamp: number;
}

export interface HvncSessionState {
  agentId: string;
  sessionId?: string;
  status: HvncConnectionStatus;
  quality: string;
  mode: string;
  fps: number;
  isLoading: boolean;
  isActive: boolean;
  lastError?: string;
  lastUpdated?: number;
  lastFrame?: HvncFramePayload;
  screenInfo?: Record<string, any>;
}

export interface HvncCommandPayload {
  type: 'mouse' | 'keyboard' | 'clipboard' | 'control';
  action: string;
  data?: Record<string, any>;
}

export interface HvncContextValue {
  sessions: Record<string, HvncSessionState>;
  getSession: (agentId: string) => HvncSessionState;
  startSession: (agentId: string, options: HvncSessionOptions) => Promise<HvncSessionResponse>;
  stopSession: (agentId: string) => Promise<HvncStopResponse | null>;
  clearSession: (agentId: string) => void;
  handleSocketEvent: (event: any) => void;
  registerTransport: (sender: ((payload: any) => void) | null) => void;
  sendCommand: (agentId: string, payload: HvncCommandPayload) => void;
}

const HvncContext = createContext<HvncContextValue | undefined>(undefined);

const defaultSession = (agentId: string): HvncSessionState => ({
  agentId,
  status: 'idle',
  quality: 'medium',
  mode: 'hidden',
  fps: 15,
  isLoading: false,
  isActive: false,
});

const resolveErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    return String((error as Record<string, unknown>).message);
  }
  return 'Unknown error';
};

export const HvncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Record<string, HvncSessionState>>({});
  const transportRef = useRef<((payload: any) => void) | undefined>();

  const upsertSession = useCallback(
    (agentId: string, updater: (session: HvncSessionState) => HvncSessionState) => {
      setSessions((prev) => {
        const current = prev[agentId] ?? defaultSession(agentId);
        const next = updater(current);

        if (next === current) {
          return prev;
        }

        return {
          ...prev,
          [agentId]: next,
        };
      });
    },
    []
  );

  const startSession = useCallback(
    async (agentId: string, options: HvncSessionOptions) => {
      upsertSession(agentId, (session) => ({
        ...session,
        status: 'connecting',
        isLoading: true,
        isActive: false,
        quality: options.quality ?? session.quality,
        mode: options.mode ?? session.mode,
        fps: options.fps ?? session.fps,
        lastError: undefined,
      }));

      try {
        const response = await hvncService.startSession(agentId, options);
        const { sessionId, status, quality, fps } = response.data;

        upsertSession(agentId, (session) => ({
          ...session,
          sessionId,
          status: (status as HvncConnectionStatus) ?? 'starting',
          quality: quality ?? session.quality,
          fps: fps ?? session.fps,
          isLoading: false,
          isActive: true,
          lastUpdated: Date.now(),
          lastError: undefined,
        }));

        return response;
      } catch (error) {
        const message = resolveErrorMessage(error);
        upsertSession(agentId, (session) => ({
          ...session,
          status: 'error',
          isLoading: false,
          isActive: false,
          lastError: message,
          lastUpdated: Date.now(),
        }));
        throw error;
      }
    },
    [upsertSession]
  );

  const stopSession = useCallback(
    async (agentId: string) => {
      const current = sessions[agentId];
      if (!current?.sessionId) {
        upsertSession(agentId, (session) => ({
          ...session,
          status: 'disconnected',
          isLoading: false,
          isActive: false,
          lastUpdated: Date.now(),
        }));
        return null;
      }

      try {
        const response = await hvncService.stopSession(agentId, current.sessionId);
        upsertSession(agentId, (session) => ({
          ...session,
          status: 'disconnected',
          isLoading: false,
          isActive: false,
          lastUpdated: Date.now(),
        }));
        return response;
      } catch (error) {
        const message = resolveErrorMessage(error);
        upsertSession(agentId, (session) => ({
          ...session,
          status: 'error',
          isLoading: false,
          isActive: false,
          lastError: message,
          lastUpdated: Date.now(),
        }));
        throw error;
      }
    },
    [sessions, upsertSession]
  );

  const clearSession = useCallback(
    (agentId: string) => {
      setSessions((prev) => {
        if (!(agentId in prev)) {
          return prev;
        }
        const clone = { ...prev };
        delete clone[agentId];
        return clone;
      });
    },
    []
  );

  const handleSocketEvent = useCallback(
    (event: any) => {
      if (!event || !event.type) {
        return;
      }

      if (event.type === 'hvnc_response') {
        const agentId = event.agentUuid || event.agentId;
        if (!agentId) return;

        upsertSession(agentId, (session) => {
          const status = (event.status as HvncConnectionStatus) ?? session.status;

          return {
            ...session,
            status,
            isLoading: status === 'connecting' || status === 'starting',
            isActive: status === 'connected',
            lastUpdated: Date.now(),
            lastError: event.error ?? session.lastError,
            screenInfo: event.screenInfo ?? session.screenInfo,
            sessionId: event.sessionId ?? session.sessionId,
          };
        });
        return;
      }

      if (event.type === 'hvnc_frame') {
        const agentId = event.agentUuid || event.agentId;
        if (!agentId || !event.frameData) {
          return;
        }

        upsertSession(agentId, (session) => ({
          ...session,
          lastFrame: {
            frameData: event.frameData,
            frameInfo: event.frameInfo,
            timestamp: Date.now(),
          },
          lastUpdated: Date.now(),
        }));
      }
    },
    [upsertSession]
  );

  const registerTransport = useCallback((sender: ((payload: any) => void) | null) => {
    if (sender) {
      transportRef.current = sender;
    } else {
      transportRef.current = undefined;
    }
  }, []);

  const sendCommand = useCallback(
    (agentId: string, payload: HvncCommandPayload) => {
      const sender = transportRef.current;
      if (!sender) {
        console.warn('[HVNC] No transport registered for HVNC commands');
        return;
      }

      const session = sessions[agentId];
      sender({
        type: 'hvnc_command',
        agentId,
        sessionId: session?.sessionId,
        payload,
        timestamp: new Date().toISOString(),
      });
    },
    [sessions]
  );

  const getSession = useCallback(
    (agentId: string) => sessions[agentId] ?? defaultSession(agentId),
    [sessions]
  );

  const value = useMemo<HvncContextValue>(
    () => ({
      sessions,
      getSession,
      startSession,
      stopSession,
      clearSession,
      handleSocketEvent,
      registerTransport,
      sendCommand,
    }),
    [sessions, getSession, startSession, stopSession, clearSession, handleSocketEvent, registerTransport, sendCommand]
  );

  return <HvncContext.Provider value={value}>{children}</HvncContext.Provider>;
};

export const useHvnc = (): HvncContextValue => {
  const context = useContext(HvncContext);
  if (!context) {
    throw new Error('useHvnc must be used within a HvncProvider');
  }
  return context;
};
