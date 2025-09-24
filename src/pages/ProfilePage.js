import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  UserIcon, 
  PencilSquareIcon,
  MapPinIcon,
  StarIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import api from '../services/api';
import toast from 'react-hot-toast';
import { updateUser } from '../store/slices/authSlice';

// Skill categories for dropdown
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

const ProfilePage = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatar: '',
    website: '',
    skills: [],
    experience: '',
    hourlyRate: 0,
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 1, category: '' });
  const [showAddSkill, setShowAddSkill] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      
      // Transform the response data to match our frontend structure
      const userData = response.data.user;
      const transformedData = {
        ...userData,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : userData.firstName || userData.lastName || userData.name || '',
        location: typeof userData.location === 'object' 
          ? userData.location.city || ''
          : userData.location || '',
        avatar: userData.avatar && userData.avatar.startsWith('http') 
          ? userData.avatar 
          : userData.avatar 
          ? `http://localhost:5000${userData.avatar}?t=${Date.now()}` // Add cache busting
          : '',
        availability: userData.availability || {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false
        }
      };
      
      console.log('Profile loaded with avatar URL:', transformedData.avatar);
      setProfileData(transformedData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Prepare profile data, stripping server URL from avatar if present
      const dataToSend = { ...profileData };
      if (dataToSend.avatar && typeof dataToSend.avatar === 'string') {
        // Remove server URL and query parameters to keep only the relative path
        dataToSend.avatar = dataToSend.avatar.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
      }
      
      const response = await api.put('/users/profile', dataToSend);
      
      // Transform the response data to match our frontend structure
      const updatedUser = response.data.user;
      const transformedData = {
        ...updatedUser,
        name: updatedUser.firstName && updatedUser.lastName 
          ? `${updatedUser.firstName} ${updatedUser.lastName}`.trim()
          : updatedUser.firstName || updatedUser.lastName || updatedUser.name || '',
        location: typeof updatedUser.location === 'object' 
          ? updatedUser.location.city || ''
          : updatedUser.location || '',
        availability: updatedUser.availability || {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false
        }
      };
      
      setProfileData(transformedData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        errors.forEach(err => {
          const fieldName = err.path || 'Field';
          const message = err.msg || 'Invalid value';
          toast.error(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${message}`);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        toast.error('Unable to connect to server. Please check if the backend is running.');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvailabilityChange = (day) => {
    setProfileData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day]
      }
    }));
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      toast.error('Please enter a skill name');
      return;
    }
    
    if (!newSkill.category) {
      toast.error('Please select a skill category');
      return;
    }
    
    const skill = {
      name: newSkill.name.trim(),
      level: newSkill.level,
      category: newSkill.category,
      verified: false
    };

    setProfileData(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));

    setNewSkill({ name: '', level: 1, category: '' });
    setShowAddSkill(false);
  };

  const removeSkill = (index) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Construct the full avatar URL with cache busting
        const avatarUrl = response.data.avatar.startsWith('http') 
          ? response.data.avatar 
          : `http://localhost:5000${response.data.avatar}?t=${Date.now()}`;
          
        console.log('Avatar uploaded, new URL:', avatarUrl);
        
        // Update local state
        setProfileData(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
        
        // Update Redux store so navbar shows the new avatar immediately
        dispatch(updateUser({ avatar: avatarUrl }));
        
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to upload profile picture. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('avatar-upload').click();
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 1: return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 2: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 3: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 4: return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 5: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
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

  const renderStars = (level) => {
    return Array(5).fill().map((_, i) => (
      i < level ? 
        <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" /> :
        <StarIcon key={i} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
    ));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your profile and skills</p>
        </div>
        
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 flex items-center space-x-2"
        >
          <PencilSquareIcon className="h-5 w-5" />
          <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="relative inline-block">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mx-auto"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Image failed to load:', e.target.src);
                    console.error('Error details:', e);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', profileData.avatar);
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto">
                  <UserIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              {isEditing && (
                <button 
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-primary-600 dark:bg-primary-500 text-white rounded-full p-2 hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload profile picture"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <PhotoIcon className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {/* Hidden file input */}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
              {profileData.name || 'Your Name'}
            </h2>
            
            <div className="flex items-center justify-center space-x-1 mt-2">
              <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">{profileData.location || 'Location not set'}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Skills</span>
                <span className="font-medium text-gray-900 dark:text-white">{profileData.skills?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Hourly Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">${profileData.hourlyRate || 0}/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profileData.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{profileData.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{profileData.phone || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    {profileData.website ? (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        {profileData.website}
                      </a>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Not set</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="City, Country"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{profileData.location || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate</label>
                {isEditing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={profileData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-12 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">/hr</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">${profileData.hourlyRate || 0}/hr</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              {isEditing ? (
                <div>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell others about yourself and your skills..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Share your expertise and what makes you unique
                    </span>
                    <span className={`text-xs ${
                      (profileData.bio?.length || 0) > 1800 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {profileData.bio?.length || 0}/2000
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{profileData.bio || 'No bio added yet'}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience</label>
              {isEditing ? (
                <div>
                  <textarea
                    value={profileData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe your professional experience and background..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Share your work history, achievements, and professional background
                    </span>
                    <span className={`text-xs ${
                      (profileData.experience?.length || 0) > 1800 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {profileData.experience?.length || 0}/2000
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{profileData.experience || 'No experience added yet'}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h3>
              {isEditing && (
                <button
                  onClick={() => setShowAddSkill(true)}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/50 flex items-center space-x-1 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Skill</span>
                </button>
              )}
            </div>

            {showAddSkill && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>Beginner</option>
                    <option value={2}>Basic</option>
                    <option value={3}>Intermediate</option>
                    <option value={4}>Advanced</option>
                    <option value={5}>Expert</option>
                  </select>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Category</option>
                    {SKILL_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddSkill(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.skills?.length > 0 ? (
                profileData.skills.map((skill, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{skill.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{skill.category}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex space-x-1">
                            {renderStars(skill.level)}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill.level)}`}>
                            {getSkillLevelText(skill.level)}
                          </span>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(index)}
                          className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 ml-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No skills added yet</p>
                  {isEditing && (
                    <button
                      onClick={() => setShowAddSkill(true)}
                      className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    >
                      Add your first skill
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Availability</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(profileData.availability || {}).map(([day, available]) => (
                <div key={day} className="text-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {day.substring(0, 3)}
                  </label>
                  {isEditing ? (
                    <button
                      onClick={() => handleAvailabilityChange(day)}
                      className={`w-full h-12 px-2 rounded-md border-2 transition-colors text-xs sm:text-sm flex items-center justify-center ${
                        available
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-center leading-tight">
                        {available ? 'Available' : 'Not Available'}
                      </span>
                    </button>
                  ) : (
                    <div className={`w-full h-12 rounded-md border-2 flex items-center justify-center ${
                      available
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}>
                      {available ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
