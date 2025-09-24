import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, MapPinIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ScheduleSessionModal = ({ isOpen, onClose, match, onSchedule, isLoading }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    type: 'online',
    location: ''
  });
  const [errors, setErrors] = useState({});

  // Helper function to convert UTC date to local datetime-local format
  const formatDateTimeForInput = (dateString) => {
    const date = new Date(dateString);
    // Get the timezone offset in minutes and convert to milliseconds
    const tzOffset = date.getTimezoneOffset() * 60000;
    // Create a new date adjusted for the local timezone
    const localDate = new Date(date.getTime() - tzOffset);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper function to get current local time in datetime-local format
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - tzOffset);
    return localNow.toISOString().slice(0, 16);
  };

  // Pre-fill form with existing session data when rescheduling
  useEffect(() => {
    if (isOpen && match?.scheduledSession) {
      const session = match.scheduledSession;
      if (session.startTime && session.endTime) {
        setFormData({
          startTime: formatDateTimeForInput(session.startTime),
          endTime: formatDateTimeForInput(session.endTime),
          type: session.type || 'online',
          location: session.location || ''
        });
      }
    } else if (isOpen) {
      // Reset form for new scheduling
      setFormData({
        startTime: '',
        endTime: '',
        type: 'online',
        location: ''
      });
    }
  }, [isOpen, match]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    
    if (formData.startTime && formData.endTime) {
      const startDateTime = new Date(formData.startTime);
      const endDateTime = new Date(formData.endTime);
      const now = new Date();
      
      if (startDateTime >= endDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }
      
      if (startDateTime < now) {
        newErrors.startTime = 'Start time must be in the future';
      }
    }
    
    if (formData.type === 'in-person' && !formData.location.trim()) {
      newErrors.location = 'Location is required for in-person sessions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert local datetime-local input to proper UTC ISO string
    const sessionData = {
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      type: formData.type,
      location: formData.location.trim()
    };
    
    onSchedule(sessionData);
  };

  const handleClose = () => {
    setFormData({
      startTime: '',
      endTime: '',
      type: 'online',
      location: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const otherUser = match?.requester?._id === localStorage.getItem('userId') ? match.receiver : match.requester;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {match?.scheduledSession ? 'Reschedule Session' : 'Schedule Session'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {match?.scheduledSession ? 'Update your' : 'Schedule a'} skill exchange session with {otherUser?.firstName} {otherUser?.lastName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              min={getCurrentLocalDateTime()}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.startTime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
            )}
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              End Date & Time
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              min={formData.startTime || getCurrentLocalDateTime()}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.endTime ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.type === 'online' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="online"
                  checked={formData.type === 'online'}
                  onChange={handleInputChange}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">Online</span>
              </label>
              <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.type === 'in-person' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="in-person"
                  checked={formData.type === 'in-person'}
                  onChange={handleInputChange}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <MapPinIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">In Person</span>
              </label>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Location {formData.type === 'in-person' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder={
                formData.type === 'online' 
                  ? 'e.g., Zoom Meeting, Google Meet (optional)'
                  : 'e.g., Local Coffee Shop, University Library'
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Session Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Session Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Skill:</span> {match?.skillOffered?.name}</p>
              <p><span className="font-medium">Teacher:</span> {match?.requester?.firstName} {match?.requester?.lastName}</p>
              <p><span className="font-medium">Learner:</span> {match?.receiver?.firstName} {match?.receiver?.lastName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (match?.scheduledSession ? 'Rescheduling...' : 'Scheduling...') : (match?.scheduledSession ? 'Reschedule Session' : 'Schedule Session')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;