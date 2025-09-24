import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a match room for real-time messaging
  joinMatch(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_match', matchId);
    }
  }

  // Leave a match room
  leaveMatch(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_match', matchId);
    }
  }

  // Send a message
  sendMessage(matchId, content, type = 'text') {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        matchId,
        content,
        type
      });
      return true;
    }
    console.warn('Cannot send message: Socket not connected');
    return false;
  }

  // Typing indicators
  startTyping(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { matchId });
    }
  }

  stopTyping(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { matchId });
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Listen for notifications
  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new_notification', callback);
    }
  }

  // Listen for match status changes
  onMatchStatusChange(callback) {
    if (this.socket) {
      this.socket.on('match_status_changed', callback);
    }
  }

  // Listen for message notifications (when not in chat)
  onMessageNotification(callback) {
    if (this.socket) {
      this.socket.on('message_notification', callback);
    }
  }

  // Update user activity
  userActive() {
    if (this.socket && this.isConnected) {
      this.socket.emit('user_active');
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Remove specific listener
  removeListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;
