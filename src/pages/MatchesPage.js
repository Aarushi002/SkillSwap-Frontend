import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import toast from 'react-hot-toast';
import ScheduleSessionModal from '../components/UI/ScheduleSessionModal';
import { scheduleSession } from '../store/slices/matchSlice';

const MatchesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading: scheduleLoading } = useSelector((state) => state.matches);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [respondingTo, setRespondingTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    skillCategory: '',
    minRating: 0,
    dateRange: 'all'
  });
  // Schedule session modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMatchForSchedule, setSelectedMatchForSchedule] = useState(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const statusFilter = activeTab === 'all' ? '' : `status=${activeTab}`;
        const response = await api.get(`/matches?${statusFilter}`);
        setMatches(response.data.matches || []);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    
    loadMatches();
  }, [activeTab]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [matches, searchTerm, filters, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFiltersAndSort = () => {
    let filtered = [...matches];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(match => {
        const otherUser = getOtherUser(match);
        const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
        const skillOffered = match.skillOffered?.name?.toLowerCase() || '';
        const skillRequested = match.skillRequested?.name?.toLowerCase() || '';
        const message = match.message?.toLowerCase() || '';
        
        return fullName.includes(term) || 
               skillOffered.includes(term) || 
               skillRequested.includes(term) ||
               message.includes(term);
      });
    }

    // Skill category filter
    if (filters.skillCategory) {
      filtered = filtered.filter(match => 
        match.skillOffered?.category === filters.skillCategory ||
        match.skillRequested?.category === filters.skillCategory
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(match => {
        const otherUser = getOtherUser(match);
        return (otherUser.rating?.average || 0) >= filters.minRating;
      });
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = filters.dateRange === 'week' ? 7 : filters.dateRange === 'month' ? 30 : 0;
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(match => new Date(match.createdAt) >= cutoff);
      }
    }

    // Sort matches
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating':
          const aRating = getOtherUser(a).rating?.average || 0;
          const bRating = getOtherUser(b).rating?.average || 0;
          return bRating - aRating;
        case 'match-score':
          return (b.matchScore || 0) - (a.matchScore || 0);
        default:
          return 0;
      }
    });

    setFilteredMatches(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      skillCategory: '',
      minRating: 0,
      dateRange: 'all'
    });
    setSortBy('newest');
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab === 'all' ? '' : `status=${activeTab}`;
      const response = await api.get(`/matches?${statusFilter}`);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const respondToMatch = async (matchId, action) => {
    try {
      setRespondingTo(matchId);
      await api.put(`/matches/${matchId}/respond`, { action });
      toast.success(`Match ${action}ed successfully`);
      fetchMatches();
    } catch (error) {
      console.error('Error responding to match:', error);
      toast.error(`Failed to ${action} match`);
    } finally {
      setRespondingTo(null);
    }
  };

  const handleScheduleSession = (match) => {
    setSelectedMatchForSchedule(match);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (sessionData) => {
    try {
      const result = await dispatch(scheduleSession({
        matchId: selectedMatchForSchedule._id,
        sessionData
      }));
      
      if (result.type === 'matches/scheduleSession/fulfilled') {
        const isRescheduling = selectedMatchForSchedule?.scheduledSession;
        toast.success(isRescheduling ? 'Session rescheduled successfully!' : 'Session scheduled successfully!');
        setShowScheduleModal(false);
        setSelectedMatchForSchedule(null);
        // Refresh matches to show updated data
        const statusFilter = activeTab === 'all' ? '' : `status=${activeTab}`;
        const response = await api.get(`/matches?${statusFilter}`);
        setMatches(response.data.matches || []);
      } else {
        toast.error(result.payload || 'Failed to schedule session');
      }
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error('Failed to schedule session');
    }
  };

  const handleScheduleModalClose = () => {
    setShowScheduleModal(false);
    setSelectedMatchForSchedule(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
        return <CheckSolidIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getOtherUser = (match) => {
    return match.requester._id === user.id ? match.receiver : match.requester;
  };

  const isReceiver = (match) => {
    return match.receiver._id === user.id;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isValidScheduledSession = (scheduledSession) => {
    return scheduledSession && 
           scheduledSession.startTime && 
           !isNaN(new Date(scheduledSession.startTime).getTime()) &&
           new Date(scheduledSession.startTime).getTime() > 0;
  };

  const tabs = [
    { id: 'all', label: 'All Matches', count: matches.length },
    { id: 'pending', label: 'Pending', count: matches.filter(m => m.status === 'pending').length },
    { id: 'accepted', label: 'Active', count: matches.filter(m => m.status === 'accepted').length },
    { id: 'completed', label: 'Completed', count: matches.filter(m => m.status === 'completed').length }
  ];

  const SKILL_CATEGORIES = [
    'Technology & Programming',
    'Design & Creative', 
    'Business & Finance',
    'Marketing & Sales',
    'Writing & Communication',
    'Education & Training',
    'Health & Wellness',
    'Music & Arts',
    'Languages',
    'Other'
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Matches</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage your skill exchange matches</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search matches by name, skills, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rating</option>
              <option value="match-score">Best Match</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span>Filters</span>
            {(filters.skillCategory || filters.minRating > 0 || filters.dateRange !== 'all') && (
              <span className="ml-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs rounded-full">
                Active
              </span>
            )}
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filteredMatches.length} of {matches.length} matches
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skill Category
              </label>
              <select
                value={filters.skillCategory}
                onChange={(e) => setFilters({ ...filters, skillCategory: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {SKILL_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 && matches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <UserCircleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No matches found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeTab === 'all' 
                ? "You haven't created or received any match requests yet"
                : `No ${activeTab} matches at the moment`
              }
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              Discover Skills
            </button>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No matches found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              No matches found with the current search and filter criteria
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredMatches.map((match, index) => {
            const otherUser = getOtherUser(match);
            const isUserReceiver = isReceiver(match);
            
            return (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* User Avatar */}
                    {otherUser.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {otherUser.firstName[0]}{otherUser.lastName[0]}
                      </div>
                    )}

                    {/* Match Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {otherUser.firstName} {otherUser.lastName}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(match.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                          </span>
                        </div>
                        {match.matchScore && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {match.matchScore}% match
                          </span>
                        )}
                      </div>

                      {/* Skills Exchange */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {isUserReceiver ? 'You offer:' : 'You want:'}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                            {isUserReceiver ? match.skillOffered.name : match.skillRequested.name}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">↔</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {isUserReceiver ? 'They want:' : 'They offer:'}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                            {isUserReceiver ? match.skillRequested.name : match.skillOffered.name}
                          </span>
                        </div>
                      </div>

                      {/* Message */}
                      {match.message && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{match.message}"</p>
                        </div>
                      )}

                      {/* Match Info */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Created {formatDate(match.createdAt)}</span>
                        {otherUser.rating && (
                          <div className="flex items-center space-x-1">
                            <StarIcon className="h-4 w-4 text-yellow-400" />
                            <span>{otherUser.rating.average.toFixed(1)} ({otherUser.rating.count})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {match.status === 'pending' && isUserReceiver && (
                      <>
                        <button
                          onClick={() => respondToMatch(match._id, 'reject')}
                          disabled={respondingTo === match._id}
                          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                        >
                          {respondingTo === match._id ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => respondToMatch(match._id, 'accept')}
                          disabled={respondingTo === match._id}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 border border-transparent rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                        >
                          {respondingTo === match._id ? 'Accepting...' : 'Accept'}
                        </button>
                      </>
                    )}

                    {match.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => navigate(`/messages/${match._id}`)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Message"
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </button>
                        {isValidScheduledSession(match.scheduledSession) ? (
                          <button
                            onClick={() => handleScheduleSession(match)}
                            className="p-2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30"
                            title="Reschedule Session"
                          >
                            <CalendarIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleScheduleSession(match)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Schedule Session"
                          >
                            <CalendarIcon className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    )}

                    {match.status === 'pending' && !isUserReceiver && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Waiting for response...</span>
                    )}
                  </div>
                </div>

                {/* Scheduled Session Info */}
                {isValidScheduledSession(match.scheduledSession) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        Session scheduled for {formatDate(match.scheduledSession.startTime)} at{' '}
                        {new Date(match.scheduledSession.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {match.scheduledSession.type && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          {match.scheduledSession.type}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={handleScheduleModalClose}
        match={selectedMatchForSchedule}
        onSchedule={handleScheduleSubmit}
        isLoading={scheduleLoading}
      />
    </div>
  );
};

export default MatchesPage;
