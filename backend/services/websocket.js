const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

class WebSocketService {
    constructor() {
        this.wss = null;
        // Map<userId, Set<WebSocket>>
        this.userConnections = new Map();
    }

    /**
     * Attach WebSocket server to an existing HTTP server
     */
    attach(httpServer) {
        this.wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

        this.wss.on('connection', (ws, req) => {
            this._handleConnection(ws, req);
        });

        // Heartbeat every 30 seconds
        this._heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    this._removeConnection(ws);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        console.log('✓ WebSocket server attached (path: /ws)');
    }

    /**
     * Handle new WebSocket connection
     */
    _handleConnection(ws, req) {
        ws.isAlive = true;
        ws.userId = null;

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this._handleMessage(ws, message);
            } catch (e) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            this._removeConnection(ws);
        });

        ws.on('error', () => {
            this._removeConnection(ws);
        });

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'CONNECTED',
            message: 'Connected to RoadSafe real-time server. Send AUTH message to authenticate.',
            timestamp: new Date().toISOString(),
        }));
    }

    /**
     * Handle incoming WebSocket messages
     */
    _handleMessage(ws, message) {
        switch (message.type) {
            case 'AUTH':
                this._authenticate(ws, message.token);
                break;
            case 'PING':
                ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
                break;
            default:
                ws.send(JSON.stringify({ type: 'ERROR', message: `Unknown message type: ${message.type}` }));
        }
    }

    /**
     * Authenticate WebSocket connection with JWT
     */
    _authenticate(ws, token) {
        if (!token) {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Token required' }));
            return;
        }

        try {
            const decoded = jwt.verify(token, config.jwt.userSecret);
            ws.userId = decoded.userId || decoded.id;

            // Add to user connections map
            if (!this.userConnections.has(ws.userId)) {
                this.userConnections.set(ws.userId, new Set());
            }
            this.userConnections.get(ws.userId).add(ws);

            ws.send(JSON.stringify({
                type: 'AUTH_SUCCESS',
                userId: ws.userId,
                message: 'Authenticated. You will receive real-time updates.',
                timestamp: new Date().toISOString(),
            }));

            console.log(`WebSocket: User ${ws.userId} authenticated (${this.userConnections.get(ws.userId).size} connections)`);
        } catch (e) {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid or expired token' }));
        }
    }

    /**
     * Remove a WebSocket connection from the user map
     */
    _removeConnection(ws) {
        if (ws.userId && this.userConnections.has(ws.userId)) {
            this.userConnections.get(ws.userId).delete(ws);
            if (this.userConnections.get(ws.userId).size === 0) {
                this.userConnections.delete(ws.userId);
            }
        }
    }

    /**
     * Send a message to a specific user (all their connections)
     */
    sendToUser(userId, event) {
        const connections = this.userConnections.get(String(userId));
        if (!connections) return;

        const payload = JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
        });

        connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    }

    /**
     * Broadcast to all authenticated users
     */
    broadcast(event) {
        const payload = JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
        });

        this.userConnections.forEach((connections) => {
            connections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(payload);
                }
            });
        });
    }

    /**
     * Get connection stats
     */
    getStats() {
        return {
            totalConnections: this.wss ? this.wss.clients.size : 0,
            authenticatedUsers: this.userConnections.size,
        };
    }

    /**
     * Shutdown
     */
    shutdown() {
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
        }
        if (this.wss) {
            this.wss.close();
        }
    }
}

// Singleton
const wsService = new WebSocketService();
module.exports = wsService;
