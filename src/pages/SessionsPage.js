import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SessionRatingModal from '../components/UI/SessionRatingModal';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const { user } = useSelector(state => state.auth);

  // Helper function to get attendance data (handles both Map and Object formats)
  const getAttendanceData = (attendance, userId) => {
    if (!attendance) return null;
    // Try Map format first
    if (typeof attendance.get === 'function') {
      return attendance.get(userId);
    }
    // Fallback to object format
    return attendance[userId];
  };

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions');

      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const markAttendance = async (sessionId, attended) => {
    try {
      await api.put(`/sessions/${sessionId}/attendance`, { attended });
      toast.success(`Attendance ${attended ? 'confirmed' : 'marked as no-show'}`);
      fetchSessions();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const processPayment = async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/payment`);
      const { details } = response.data;
      
      if (details) {
        toast.success(
          `Payment processed! ${details.amount} tokens paid for ${Math.round(details.sessionDuration / 60 * 10) / 10}h ${details.skillName} session`,
          { duration: 5000 }
        );
      } else {
        toast.success('Payment processed successfully');
      }
      
      fetchSessions();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const getSessionStatus = (session) => {
    if (!session.scheduledSession) return 'not-scheduled';
    
    const now = new Date();
    const startTime = new Date(session.scheduledSession.startTime);
    const endTime = new Date(session.scheduledSession.endTime);

    // Check for invalid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.warn('Invalid dates in session:', session._id, {
        startTime: session.scheduledSession.startTime,
        endTime: session.scheduledSession.endTime
      });
      return 'invalid-date';
    }

    if (session.scheduledSession.status === 'completed') return 'completed';
    if (session.scheduledSession.status === 'missed') return 'missed';
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'in-progress';
    if (now > endTime) return 'completed';
    return 'unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'in-progress': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      case 'missed': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'not-scheduled': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'invalid-date': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherParticipant = (session) => {
    return session.requester._id === user._id ? session.receiver : session.requester;
  };

  const canMarkAttendance = (session) => {
    const status = getSessionStatus(session);
    const attendance = session.scheduledSession?.attendance;
    if (!attendance) return status === 'completed';
    
    // Check if user hasn't marked attendance yet
    const userAttendance = getAttendanceData(attendance, user._id);
    return status === 'completed' && !userAttendance;
  };

  const canProcessPayment = (session) => {
    const status = getSessionStatus(session);
    const attendance = session.scheduledSession?.attendance;
    
    if (!attendance || status !== 'completed' || session.scheduledSession?.paymentProcessed) {
      return false;
    }
    
    // Check if both participants attended
    const requesterAttendance = getAttendanceData(attendance, session.requester._id);
    const receiverAttendance = getAttendanceData(attendance, session.receiver._id);
    
    return requesterAttendance?.attended && receiverAttendance?.attended;
  };

  const canRateSession = (session) => {
    const status = getSessionStatus(session);
    const userAttendance = getAttendanceData(session.scheduledSession?.attendance, user._id);
    const userAttended = userAttendance?.attended;
    const isRequester = session.requester._id === user._id;
    const sessionRating = session.scheduledSession?.sessionRating;
    const hasRated = isRequester ? sessionRating?.requesterRating : sessionRating?.receiverRating;
    
    return status === 'completed' && userAttended && !hasRated;
  };

  const openRatingModal = (session) => {
    setSelectedSession(session);
    setRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setSelectedSession(null);
    setRatingModalOpen(false);
  };

  const handleRatingSubmitted = () => {
    fetchSessions();
  };

  const filteredSessions = sessions.filter(session => {
    const status = getSessionStatus(session);
    if (activeTab === 'all') return true;
    return status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Sessions</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your scheduled skill exchange sessions</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['all', 'upcoming', 'in-progress', 'completed', 'missed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab === 'all' ? 'All Sessions' : tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📅</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No sessions found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'all' 
              ? "You don't have any scheduled sessions yet."
              : `No ${activeTab.replace('-', ' ')} sessions found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const otherParticipant = getOtherParticipant(session);
            const status = getSessionStatus(session);
            const isRequester = session.requester._id === user._id;

            return (
              <div key={session._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={otherParticipant.avatar || '/default-avatar.png'}
                        alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {otherParticipant.firstName} {otherParticipant.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isRequester ? 'Teaching you' : 'Learning from you'}: {
                            isRequester ? session.skillRequested.name : session.skillOffered.name
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {session.scheduledSession?.startTime ? formatDateTime(session.scheduledSession.startTime) : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {session.scheduledSession?.endTime ? formatDateTime(session.scheduledSession.endTime) : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">
                          {session.scheduledSession?.type || 'Not scheduled'}
                        </p>
                      </div>
                      {session.scheduledSession?.location && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
                          <p className="text-sm text-gray-900 dark:text-white">{session.scheduledSession.location}</p>
                        </div>
                      )}
                    </div>

                    {/* Attendance Status */}
                    {session.scheduledSession.attendance && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attendance</p>
                        <div className="flex space-x-4">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">You:</span>
                            {(() => {
                              const userAttendance = getAttendanceData(session.scheduledSession.attendance, user._id);
                              const attended = userAttendance?.attended;
                              return (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  attended === true
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                    : attended === false 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                }`}>
                                  {attended === true ? 'Attended' : attended === false ? 'No Show' : 'Pending'}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{otherParticipant.firstName}:</span>
                            {(() => {
                              const otherAttendance = getAttendanceData(session.scheduledSession.attendance, otherParticipant._id);
                              const attended = otherAttendance?.attended;
                              return (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  attended === true
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                    : attended === false 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                }`}>
                                  {attended === true ? 'Attended' : attended === false ? 'No Show' : 'Pending'}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
                      {status === 'invalid-date' ? 'not scheduled' : 
                       status === 'not-scheduled' ? 'not scheduled' : 
                       status.replace('-', ' ')}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      {canMarkAttendance(session) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAttendance(session._id, true)}
                            className="px-3 py-1 bg-green-600 dark:bg-green-500 text-white text-xs rounded hover:bg-green-700 dark:hover:bg-green-600"
                          >
                            I Attended
                          </button>
                          <button
                            onClick={() => markAttendance(session._id, false)}
                            className="px-3 py-1 bg-red-600 dark:bg-red-500 text-white text-xs rounded hover:bg-red-700 dark:hover:bg-red-600"
                          >
                            No Show
                          </button>
                        </div>
                      )}

                      {canProcessPayment(session) && (
                        <button
                          onClick={() => processPayment(session._id)}
                          className="px-3 py-1 bg-primary-600 dark:bg-primary-500 text-white text-xs rounded hover:bg-primary-700 dark:hover:bg-primary-600"
                        >
                          Process Payment
                        </button>
                      )}

                      {canRateSession(session) && (
                        <button
                          onClick={() => openRatingModal(session)}
                          className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white text-xs rounded hover:bg-purple-700 dark:hover:bg-purple-600"
                        >
                          Rate Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      <SessionRatingModal
        isOpen={ratingModalOpen}
        onClose={closeRatingModal}
        session={selectedSession}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
};

export default SessionsPage;