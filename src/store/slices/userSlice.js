import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const discoverUsers = createAsyncThunk(
  'users/discoverUsers',
  async ({ page = 1, category, location }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page });
      if (category) params.append('category', category);
      if (location) params.append('location', location);
      
      const response = await api.get(`/users/discover?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to discover users');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'users/getUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/profile/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateSkills = createAsyncThunk(
  'users/updateSkills',
  async (skills, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/skills', { skills });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update skills');
    }
  }
);

export const updateSkillsWanted = createAsyncThunk(
  'users/updateSkillsWanted',
  async (skillsWanted, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/skills-wanted', { skillsWanted });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update skills wanted');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    discoveredUsers: [],
    currentProfile: null,
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
    clearDiscoveredUsers: (state) => {
      state.discoveredUsers = [];
    },
    setCurrentProfile: (state, action) => {
      state.currentProfile = action.payload;
    },
    clearCurrentProfile: (state) => {
      state.currentProfile = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Discover users
      .addCase(discoverUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(discoverUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.discoveredUsers = action.payload.matches;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(discoverUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get user profile
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProfile = action.payload.user;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Update current profile if it's the same user
        if (state.currentProfile?._id === action.payload.user._id) {
          state.currentProfile = action.payload.user;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update skills
      .addCase(updateSkills.fulfilled, (state, action) => {
        if (state.currentProfile) {
          state.currentProfile.skills = action.payload.skills;
        }
      })
      // Update skills wanted
      .addCase(updateSkillsWanted.fulfilled, (state, action) => {
        if (state.currentProfile) {
          state.currentProfile.skillsWanted = action.payload.skillsWanted;
        }
      });
  },
});

export const {
  clearError,
  clearDiscoveredUsers,
  setCurrentProfile,
  clearCurrentProfile
} = userSlice.actions;

export default userSlice.reducer;
