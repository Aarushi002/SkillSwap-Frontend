import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  CurrencyDollarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const WalletPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWalletData();
  }, [filter]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch balance
      const balanceResponse = await api.get('/transactions/balance');
      setBalance(balanceResponse.data.balance);

      // Fetch transactions
      const transactionsResponse = await api.get(`/transactions?type=${filter === 'all' ? '' : filter}`);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (transaction) => {
    const isReceived = transaction.to._id === user.id;
    return isReceived ? (
      <ArrowDownIcon className="h-5 w-5 text-green-500" />
    ) : (
      <ArrowUpIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getTransactionAmount = (transaction) => {
    const isReceived = transaction.to._id === user.id;
    return `${isReceived ? '+' : '-'}${transaction.amount}`;
  };

  const getTransactionColor = (transaction) => {
    const isReceived = transaction.to._id === user.id;
    return isReceived ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionDescription = (transaction) => {
    const isReceived = transaction.to._id === user.id;
    const otherUser = isReceived ? transaction.from : transaction.to;
    
    if (transaction.type === 'skill_exchange') {
      return isReceived 
        ? `Received from ${otherUser.firstName} ${otherUser.lastName}`
        : `Sent to ${otherUser.firstName} ${otherUser.lastName}`;
    }
    
    return transaction.description;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your tokens and transactions</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-500 dark:to-purple-500 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90">Token Balance</h2>
            <p className="text-4xl font-bold mt-2">{balance}</p>
            <p className="text-sm opacity-75 mt-1">SkillSwap Tokens</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-30 rounded-full">
            <CurrencyDollarIcon className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ArrowDownIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Received</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {transactions
                  .filter(t => t.to._id === user.id && t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ArrowUpIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {transactions
                  .filter(t => t.from._id === user.id && t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {transactions.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transaction History</h3>
            
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Transactions</option>
                <option value="skill_exchange">Skill Exchanges</option>
                <option value="bonus">Bonuses</option>
                <option value="refund">Refunds</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <CurrencyDollarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {getTransactionIcon(transaction)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getTransactionDescription(transaction)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.description}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {transaction.status}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getTransactionColor(transaction)}`}>
                      {getTransactionAmount(transaction)} tokens
                    </p>
                    {transaction.metadata?.skillName && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.metadata.skillName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">How Tokens Work</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• You start with 100 tokens when you join SkillSwap Hub</li>
          <li>• Earn tokens by teaching skills to other users</li>
          <li>• Spend tokens to learn from skilled community members</li>
          <li>• Token rates are set by individual skill providers</li>
          <li>• All transactions are secure and recorded in your history</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletPage;
