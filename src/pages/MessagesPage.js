import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  PaperAirplaneIcon, 
  CalendarIcon,
  VideoCameraIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const { matchId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastFetchedMatch = useRef(null);
  const currentSocketMatch = useRef(null);

  useEffect(() => {
    fetchMatches();
    
    // Ensure socket is connected when component mounts
    if (!socketService.getConnectionStatus()) {
      // Try to reconnect if needed (this depends on your auth setup)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        socketService.connect(token);
      }
    }
  }, []);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find(m => m._id === matchId);
      if (match && (!selectedMatch || selectedMatch._id !== matchId)) {
        setSelectedMatch(match);
        
        // Only fetch messages if we haven't fetched for this match before
        if (lastFetchedMatch.current !== matchId) {
          fetchMessages(matchId, true);
          lastFetchedMatch.current = matchId;
        }
        
        // Ensure socket is connected before joining match
        if (socketService.getConnectionStatus()) {
          socketService.joinMatch(matchId);
        } else {
          // Wait for connection and then join
          const interval = setInterval(() => {
            if (socketService.getConnectionStatus()) {
              socketService.joinMatch(matchId);
              clearInterval(interval);
            }
          }, 100);
          
          // Clear interval after 5 seconds to avoid infinite loop
          setTimeout(() => clearInterval(interval), 5000);
        }
      }
    }
  }, [matchId, matches, selectedMatch]);

  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('Received new message:', data); // Debug log
      if (data.matchId === selectedMatch?._id) {
        setMessages(prev => {
          // Remove any optimistic message with the same content and sender
          let filteredMessages = prev.filter(msg => 
            !(msg.isOptimistic && 
              msg.content === data.message.content && 
              msg.sender._id === data.message.sender._id)
          );

          // Prevent duplicate messages
          const messageExists = filteredMessages.some(msg => msg._id === data.message._id);
          if (!messageExists) {
            // Add new message and sort by creation time to maintain order
            const updatedMessages = [...filteredMessages, data.message];
            return updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          }
          return filteredMessages;
        });
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user.id && data.matchId === selectedMatch?._id) {
        setTyping(data.isTyping ? data.userName : null);
        
        if (data.isTyping && typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setTyping(null);
          }, 3000);
        }
      }
    };

    // Set up socket listeners once
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    
    // Track current socket match
    if (selectedMatch) {
      currentSocketMatch.current = selectedMatch._id;
    }

    return () => {
      if (currentSocketMatch.current) {
        socketService.leaveMatch(currentSocketMatch.current);
        currentSocketMatch.current = null;
      }
      socketService.removeListener('new_message');
      socketService.removeListener('user_typing');
    };
  }, [selectedMatch, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/matches?status=accepted');
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId, shouldOverwrite = true) => {
    try {
      const response = await api.get(`/messages/${matchId}`);
      const fetchedMessages = response.data.messages || [];
      
      if (shouldOverwrite) {
        setMessages(fetchedMessages);
      } else {
        // Merge with existing messages, avoiding duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg._id));
          const newMessages = fetchedMessages.filter(msg => !existingIds.has(msg._id));
          return [...prev, ...newMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };



  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Check socket connection before sending
      if (!socketService.getConnectionStatus()) {
        toast.error('Connection lost. Please refresh the page.');
        setNewMessage(messageText); // Restore message
        return;
      }

      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        _id: `temp_${Date.now()}`,
        content: messageText,
        sender: { _id: user.id, firstName: user.firstName, lastName: user.lastName },
        createdAt: new Date().toISOString(),
        type: 'text',
        isOptimistic: true
      };

      // Add optimistic message to UI in correct chronological order
      setMessages(prev => {
        const updatedMessages = [...prev, optimisticMessage];
        return updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      // Send message via socket
      const messageSent = socketService.sendMessage(selectedMatch._id, messageText);
      if (!messageSent) {
        toast.error('Failed to send message. Please check your connection.');
        setNewMessage(messageText); // Restore message
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id)); // Remove optimistic message
        return;
      }
      socketService.stopTyping(selectedMatch._id);

      // Cleanup optimistic message after 10 seconds if no real message received
      // The real message should replace this through the socket listener
      const cleanup = setTimeout(() => {
        setMessages(prev => {
          // Only remove if it's still optimistic and no real message with same content exists
          const hasRealMessage = prev.some(msg => 
            !msg.isOptimistic && 
            msg.content === optimisticMessage.content && 
            msg.sender._id === optimisticMessage.sender._id
          );
          
          if (hasRealMessage) {
            return prev.filter(msg => msg._id !== optimisticMessage._id);
          }
          
          // If no real message exists, keep the optimistic one but mark it as failed
          return prev.map(msg => 
            msg._id === optimisticMessage._id 
              ? { ...msg, failed: true, isOptimistic: false }
              : msg
          );
        });
      }, 10000);

      // Store cleanup function to cancel if component unmounts
      return () => clearTimeout(cleanup);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message
    }
  };

  const handleTyping = () => {
    if (selectedMatch) {
      socketService.startTyping(selectedMatch._id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(selectedMatch._id);
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherUser = (match) => {
    return match.requester._id === user.id ? match.receiver : match.requester;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start by accepting some match requests!</p>
            </div>
          ) : (
            matches.map((match) => {
              const otherUser = getOtherUser(match);
              return (
                <div
                  key={match._id}
                  onClick={() => {
                    if (selectedMatch && selectedMatch._id !== match._id) {
                      socketService.leaveMatch(selectedMatch._id);
                    }
                    setSelectedMatch(match);
                    
                    // Only fetch messages if we haven't fetched for this match before
                    const isInitialLoad = lastFetchedMatch.current !== match._id;
                    if (isInitialLoad) {
                      fetchMessages(match._id, true);
                      lastFetchedMatch.current = match._id;
                    }
                    
                    // Ensure socket connection before joining
                    if (socketService.getConnectionStatus()) {
                      socketService.joinMatch(match._id);
                    } else {
                      // Wait for connection and then join
                      const interval = setInterval(() => {
                        if (socketService.getConnectionStatus()) {
                          socketService.joinMatch(match._id);
                          clearInterval(interval);
                        }
                      }, 100);
                      
                      setTimeout(() => clearInterval(interval), 5000);
                    }
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedMatch?._id === match._id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {otherUser.firstName[0]}{otherUser.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {otherUser.firstName} {otherUser.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {match.skillOffered.name} ↔ {match.skillRequested.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedMatch ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getOtherUser(selectedMatch).firstName[0]}{getOtherUser(selectedMatch).lastName[0]}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {getOtherUser(selectedMatch).firstName} {getOtherUser(selectedMatch).lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Exchanging {selectedMatch.skillOffered.name} for {selectedMatch.skillRequested.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <VideoCameraIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <CalendarIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender._id === user.id
                        ? message.failed 
                          ? 'bg-red-500 dark:bg-red-600 text-white opacity-70'
                          : message.isOptimistic 
                            ? 'bg-primary-400 dark:bg-primary-500 text-white opacity-80'
                            : 'bg-primary-600 dark:bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs mt-1 ${
                        message.sender._id === user.id ? 'text-primary-200 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                      {message.failed && (
                        <span className="text-xs text-red-200 dark:text-red-300 ml-2">Failed</span>
                      )}
                      {message.isOptimistic && !message.failed && (
                        <span className="text-xs text-primary-200 dark:text-primary-300 ml-2">Sending...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                    <p className="text-sm">{typing} is typing...</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <DocumentIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Select a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
