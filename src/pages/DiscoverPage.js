import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  MapPinIcon, 
  StarIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import toast from 'react-hot-toast';

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
  'Crafts & DIY',
  'Sports & Fitness',
  'Cooking & Culinary',
  'Photography & Video',
  'Consulting & Strategy',
  'Data & Analytics',
  'Engineering',
  'Legal & Compliance',
  'Project Management',
  'Customer Service',
  'Other'
];

const DiscoverPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minRating: 0,
    maxHourlyRate: 1000,
    location: '',
    skillLevel: ''
  });
  const [likedUsers, setLikedUsers] = useState(new Set());

  useEffect(() => {
    fetchPotentialMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPotentialMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/discover');
      setUsers(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load potential matches');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(userMatch => {
        const user = userMatch.user;
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const skillNames = user.skills?.map(skill => skill.name.toLowerCase()).join(' ') || '';
        const bio = user.bio?.toLowerCase() || '';
        
        return fullName.includes(term) || 
               skillNames.includes(term) || 
               bio.includes(term);
      });
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(userMatch => 
        userMatch.user.skills?.some(skill => 
          skill.category === filters.category
        )
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(userMatch => 
        userMatch.user.rating?.average >= filters.minRating
      );
    }

    // Hourly rate filter
    if (filters.maxHourlyRate < 1000) {
      filtered = filtered.filter(userMatch => 
        (userMatch.user.hourlyRate || 0) <= filters.maxHourlyRate
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(userMatch => 
        userMatch.user.location?.city?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Skill level filter
    if (filters.skillLevel) {
      const levelMap = { 'beginner': [1, 2], 'intermediate': [3], 'advanced': [4, 5] };
      const levels = levelMap[filters.skillLevel] || [];
      if (levels.length > 0) {
        filtered = filtered.filter(userMatch => 
          userMatch.user.skills?.some(skill => levels.includes(skill.level))
        );
      }
    }

    setFilteredUsers(filtered);
  };

  const handleSendMatchRequest = async (targetUser) => {
    try {
      const skillOffered = targetUser.skills?.[0] || { name: 'General Skills', category: 'Other' };
      const skillRequested = targetUser.skills?.[0] || { name: 'General Skills', category: 'Other' };

      await api.post('/matches', {
        receiverId: targetUser._id,
        skillOffered: {
          name: skillOffered.name,
          category: skillOffered.category,
          description: `${skillOffered.name} tutoring and guidance`
        },
        skillRequested: {
          name: skillRequested.name,
          category: skillRequested.category,
          description: `Learn ${skillRequested.name} fundamentals`
        },
        message: `Hi ${targetUser.firstName}! I'd love to exchange skills with you. Your ${skillRequested.name} expertise looks great!`
      });
      
      setLikedUsers(prev => new Set([...prev, targetUser._id]));
      toast.success('Match request sent!');
    } catch (error) {
      console.error('Error sending match request:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Unable to send match request');
      } else {
        toast.error('Failed to send match request');
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      minRating: 0,
      maxHourlyRate: 1000,
      location: '',
      skillLevel: ''
    });
    setSearchTerm('');
  };

  const getSkillLevelText = (level) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Basic';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 1: return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 2: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 3: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 4: return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 5: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discover Skills</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Find people with the skills you want to learn</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, skills, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span>Filters</span>
            {(filters.category || filters.minRating > 0 || filters.maxHourlyRate < 1000 || filters.location || filters.skillLevel) && (
              <span className="ml-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs rounded-full">
                Active
              </span>
            )}
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filteredUsers.length} users found
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skill Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
                Max Hourly Rate: ${filters.maxHourlyRate}
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={filters.maxHourlyRate}
                onChange={(e) => setFilters({ ...filters, maxHourlyRate: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, New York..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skill Level
              </label>
              <select
                value={filters.skillLevel}
                onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner (1-2)</option>
                <option value="intermediate">Intermediate (3)</option>
                <option value="advanced">Advanced (4-5)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Cards Grid */}
      {filteredUsers.length === 0 && !loading ? (
        <div className="text-center py-12">
          <HeartIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No matches found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={resetFilters}
            className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userMatch, index) => {
            const user = userMatch.user;
            const isLiked = likedUsers.has(user._id);
            
            return (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* User Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start space-x-4 mb-4">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      {user.location?.city && (
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                          <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="text-sm truncate">{user.location.city}</span>
                        </div>
                      )}
                      <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(user.rating?.average || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {user.rating?.average?.toFixed(1) || 'New'} ({user.rating?.count || 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rate & Match Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      <span>${user.hourlyRate || 0}/hr</span>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                      {userMatch.matchScore || 85}% Match
                    </span>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                      {user.bio}
                    </p>
                  )}

                  {/* Skills */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {user.skills?.slice(0, 4).map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className={`px-2 py-1 text-xs rounded-full ${getSkillLevelColor(skill.level)}`}
                          >
                            {skill.name} ({getSkillLevelText(skill.level)})
                          </span>
                        ))}
                        {user.skills?.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                            +{user.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => handleSendMatchRequest(user)}
                    disabled={isLiked}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isLiked
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 cursor-not-allowed'
                        : 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                    }`}
                  >
                    <HeartSolidIcon className="h-4 w-4" />
                    <span className="text-sm">
                      {isLiked ? 'Request Sent' : 'Send Request'}
                    </span>
                  </button>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-3 w-3 inline mr-1" />
                    Active recently
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
