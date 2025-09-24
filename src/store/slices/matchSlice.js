import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async ({ status, type, page = 1 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page });
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      
      const response = await api.get(`/matches?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch matches');
    }
  }
);

export const createMatch = createAsyncThunk(
  'matches/createMatch',
  async (matchData, { rejectWithValue }) => {
    try {
      const response = await api.post('/matches', matchData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create match');
    }
  }
);

export const respondToMatch = createAsyncThunk(
  'matches/respondToMatch',
  async ({ matchId, action }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/matches/${matchId}/respond`, { action });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to respond to match');
    }
  }
);

export const scheduleSession = createAsyncThunk(
  'matches/scheduleSession',
  async ({ matchId, sessionData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/matches/${matchId}/schedule`, sessionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to schedule session');
    }
  }
);

export const completeMatch = createAsyncThunk(
  'matches/completeMatch',
  async ({ matchId, rating }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/matches/${matchId}/complete`, { rating });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete match');
    }
  }
);

const matchSlice = createSlice({
  name: 'matches',
  initialState: {
    matches: [],
    currentMatch: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      pages: 1,
      total: 0,
      limit: 10
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentMatch: (state, action) => {
      state.currentMatch = action.payload;
    },
    updateMatchStatus: (state, action) => {
      const { matchId, status } = action.payload;
      const match = state.matches.find(m => m._id === matchId);
      if (match) {
        match.status = status;
      }
      if (state.currentMatch?._id === matchId) {
        state.currentMatch.status = status;
      }
    },
    addMatch: (state, action) => {
      state.matches.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch matches
      .addCase(fetchMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matches = action.payload.matches;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create match
      .addCase(createMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matches.unshift(action.payload.match);
        state.error = null;
      })
      .addCase(createMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Respond to match
      .addCase(respondToMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(respondToMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedMatch = action.payload.match;
        const index = state.matches.findIndex(m => m._id === updatedMatch._id);
        if (index !== -1) {
          state.matches[index] = updatedMatch;
        }
        if (state.currentMatch?._id === updatedMatch._id) {
          state.currentMatch = updatedMatch;
        }
        state.error = null;
      })
      .addCase(respondToMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Schedule session
      .addCase(scheduleSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scheduleSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const updatedMatch = action.payload.match;
        const index = state.matches.findIndex(m => m._id === updatedMatch._id);
        if (index !== -1) {
          state.matches[index] = updatedMatch;
        }
        if (state.currentMatch?._id === updatedMatch._id) {
          state.currentMatch = updatedMatch;
        }
      })
      .addCase(scheduleSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Complete match
      .addCase(completeMatch.fulfilled, (state, action) => {
        const updatedMatch = action.payload.match;
        const index = state.matches.findIndex(m => m._id === updatedMatch._id);
        if (index !== -1) {
          state.matches[index] = updatedMatch;
        }
        if (state.currentMatch?._id === updatedMatch._id) {
          state.currentMatch = updatedMatch;
        }
      });
  },
});

export const { clearError, setCurrentMatch, updateMatchStatus, addMatch } = matchSlice.actions;
export default matchSlice.reducer;
