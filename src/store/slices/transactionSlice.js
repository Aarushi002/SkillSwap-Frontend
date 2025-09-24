import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ type, page = 1 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page });
      if (type) params.append('type', type);
      
      const response = await api.get(`/transactions?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const getTokenBalance = createAsyncThunk(
  'transactions/getTokenBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/balance');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get token balance');
    }
  }
);

export const processSkillExchange = createAsyncThunk(
  'transactions/processSkillExchange',
  async ({ matchId, amount, receiverId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/skill-exchange', {
        matchId,
        amount,
        receiverId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process payment');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    tokenBalance: 0,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      pages: 1,
      total: 0,
      limit: 20
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTokenBalance: (state, action) => {
      state.tokenBalance = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get token balance
      .addCase(getTokenBalance.pending, (state) => {
        state.error = null;
      })
      .addCase(getTokenBalance.fulfilled, (state, action) => {
        state.tokenBalance = action.payload.balance;
        state.error = null;
      })
      .addCase(getTokenBalance.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Process skill exchange
      .addCase(processSkillExchange.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processSkillExchange.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload.transaction);
        // Update balance (subtract the amount sent)
        state.tokenBalance -= action.payload.transaction.amount;
        state.error = null;
      })
      .addCase(processSkillExchange.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  updateTokenBalance,
  addTransaction
} = transactionSlice.actions;

export default transactionSlice.reducer;
