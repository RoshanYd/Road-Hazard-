'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export type WSEventType = 'STATUS_UPDATE' | 'ADMIN_RESPONSE' | 'NOTE_ADDED' | 'SENSOR_ALERT' | 'PROXIMITY_ALERT';

export interface WSEvent {
    type: WSEventType;
    reportId?: string;
    message?: string;
    timestamp?: string;
    [key: string]: any;
}

type EventHandler = (event: WSEvent) => void;

interface UseWebSocketReturn {
    isConnected: boolean;
    isAuthenticated: boolean;
    on: (type: WSEventType, handler: EventHandler) => () => void;
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const WS_URL = (typeof window !== 'undefined')
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:5000/ws`
    : '';

export function useWebSocket(): UseWebSocketReturn {
    const { user } = useAuthStore();
    const wsRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<Map<WSEventType, Set<EventHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptRef = useRef(0);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const connect = useCallback(() => {
        if (!user || typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;
            setConnectionState('connecting');

            ws.onopen = () => {
                setConnectionState('connected');
                reconnectAttemptRef.current = 0;
                // Authenticate immediately
                ws.send(JSON.stringify({ type: 'AUTH', token }));
            };

            ws.onmessage = (event) => {
                try {
                    const data: WSEvent = JSON.parse(event.data);

                    if (data.type === 'AUTH_SUCCESS') {
                        setIsAuthenticated(true);
                        console.log('🔌 WebSocket authenticated');
                        return;
                    }

                    if (data.type === 'AUTH_ERROR') {
                        console.warn('WebSocket auth failed:', data.message);
                        setIsAuthenticated(false);
                        return;
                    }

                    if (data.type === 'CONNECTED' || data.type === 'PONG') return;

                    // Dispatch event to registered handlers
                    const handlers = handlersRef.current.get(data.type as WSEventType);
                    if (handlers) {
                        handlers.forEach(handler => handler(data));
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            };

            ws.onclose = () => {
                setConnectionState('disconnected');
                setIsAuthenticated(false);
                wsRef.current = null;

                // Auto-reconnect with exponential backoff
                const attempt = reconnectAttemptRef.current;
                if (attempt < 10) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                    reconnectAttemptRef.current++;
                    setConnectionState('reconnecting');
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            };

            ws.onerror = () => {
                // onclose will fire after onerror, let it handle reconnect
            };
        } catch (e) {
            setConnectionState('disconnected');
        }
    }, [user]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);

    const on = useCallback((type: WSEventType, handler: EventHandler) => {
        if (!handlersRef.current.has(type)) {
            handlersRef.current.set(type, new Set());
        }
        handlersRef.current.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            handlersRef.current.get(type)?.delete(handler);
        };
    }, []);

    return {
        isConnected: connectionState === 'connected',
        isAuthenticated,
        on,
        connectionState,
    };
}
