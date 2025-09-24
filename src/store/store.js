import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import matchSlice from './slices/matchSlice';
import messageSlice from './slices/messageSlice';
import notificationSlice from './slices/notificationSlice';
import userSlice from './slices/userSlice';
import transactionSlice from './slices/transactionSlice';
import themeSlice from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    matches: matchSlice,
    messages: messageSlice,
    notifications: notificationSlice,
    users: userSlice,
    transactions: transactionSlice,
    theme: themeSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
