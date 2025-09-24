import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ matchId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/${matchId}?page=${page}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ matchId, content, type = 'text' }, { rejectWithValue }) => {
    try {
      const response = await api.post('/messages', { matchId, content, type });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/messages/conversations/list');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return { messageId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    conversations: [],
    currentMessages: [],
    currentMatchId: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      pages: 1,
      total: 0,
      limit: 50
    },
    typingUsers: [], // Users currently typing
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentMatchId: (state, action) => {
      state.currentMatchId = action.payload;
      state.currentMessages = [];
    },
    addMessage: (state, action) => {
      const message = action.payload;
      // Add to current messages if it's for the current match
      if (state.currentMatchId === message.match) {
        state.currentMessages.push(message);
      }
      
      // Update conversation list
      const conversationIndex = state.conversations.findIndex(
        conv => conv.match._id === message.match
      );
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = {
          content: message.content,
          createdAt: message.createdAt,
          sender: message.sender,
          type: message.type
        };
        // Move to top
        const conversation = state.conversations.splice(conversationIndex, 1)[0];
        state.conversations.unshift(conversation);
      }
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      const { userId, userName, isTyping } = action.payload;
      if (isTyping) {
        if (!state.typingUsers.find(user => user.userId === userId)) {
          state.typingUsers.push({ userId, userName });
        }
      } else {
        state.typingUsers = state.typingUsers.filter(user => user.userId !== userId);
      }
    },
    clearMessages: (state) => {
      state.currentMessages = [];
      state.currentMatchId = null;
    },
    updateConversationUnreadCount: (state, action) => {
      const { matchId, count } = action.payload;
      const conversation = state.conversations.find(conv => conv.match._id === matchId);
      if (conversation) {
        conversation.unreadCount = count;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMessages = action.payload.messages;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added through socket event
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload.conversations;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        // Update message read status if needed
        const messageId = action.payload.messageId;
        const message = state.currentMessages.find(m => m._id === messageId);
        if (message) {
          // Update read status
        }
      });
  },
});

export const {
  clearError,
  setCurrentMatchId,
  addMessage,
  setTypingUsers,
  addTypingUser,
  clearMessages,
  updateConversationUnreadCount
} = messageSlice.actions;

export default messageSlice.reducer;
