import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  WalletIcon,
  PlusIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { fetchMatches } from '../store/slices/matchSlice';
import { getTokenBalance } from '../store/slices/transactionSlice';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { matches, isLoading: matchesLoading } = useSelector((state) => state.matches);
  const { tokenBalance } = useSelector((state) => state.transactions);

  useEffect(() => {
    dispatch(fetchMatches({ page: 1, limit: 5 }));
    dispatch(getTokenBalance());
  }, [dispatch]);

  const stats = [
    {
      name: 'Active Matches',
      value: matches.filter(m => m.status === 'accepted').length,
      icon: HeartIcon,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      name: 'Pending Requests',
      value: matches.filter(m => m.status === 'pending').length,
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Token Balance',
      value: tokenBalance,
      icon: WalletIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: 'Skills Offered',
      value: user?.skills?.length || 0,
      icon: TrophyIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const recentMatches = matches.slice(0, 5);

  if (matchesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-primary-100 dark:text-primary-200 mb-6">
          Ready to learn something new or share your expertise today?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/discover"
            className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-100 text-primary-600 dark:text-primary-700 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-200 transition-colors"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Discover Skills
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center px-6 py-3 bg-primary-700 dark:bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-800 dark:hover:bg-primary-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Update Profile
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Matches */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Matches</h2>
              <Link
                to="/matches"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <div key={match._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {match.requester._id === user.id ? (
                          <img
                            src={match.receiver.avatar || '/default-avatar.png'}
                            alt={`${match.receiver.firstName} ${match.receiver.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src={match.requester.avatar || '/default-avatar.png'}
                            alt={`${match.requester.firstName} ${match.requester.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {match.requester._id === user.id 
                            ? `${match.receiver.firstName} ${match.receiver.lastName}`
                            : `${match.requester.firstName} ${match.requester.lastName}`
                          }
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {match.skillOffered.name} ↔ {match.skillRequested.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        match.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        match.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        match.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No matches yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start discovering people with complementary skills.
                </p>
                <div className="mt-6">
                  <Link
                    to="/discover"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Discover Skills
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/discover"
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Discover New Skills</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Find people to learn from</p>
                </div>
              </div>
            </Link>

            <Link
              to="/messages"
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Check Messages</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chat with your matches</p>
                </div>
              </div>
            </Link>

            <Link
              to="/profile"
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <div className="flex items-center">
                <TrophyIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Update Skills</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add what you can teach</p>
                </div>
              </div>
            </Link>

            <Link
              to="/wallet"
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <div className="flex items-center">
                <WalletIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Manage Wallet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View transactions and balance</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Skills Summary */}
      {user?.skills && user.skills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.slice(0, 10).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
              >
                {skill.name}
              </span>
            ))}
            {user.skills.length > 10 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                +{user.skills.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
