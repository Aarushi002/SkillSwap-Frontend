import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { isDarkMode } = useSelector((state) => state.theme);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        isDarkMode 
          ? 'bg-primary-600 focus:ring-offset-gray-800' 
          : 'bg-gray-200 focus:ring-offset-white'
      } ${className}`}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Switch knob */}
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200 ${
          isDarkMode ? 'translate-x-3' : 'translate-x-0.5'
        }`}
      />
      
      {/* Icons */}
      <SunIcon 
        className={`absolute left-0.5 w-3 h-3 text-yellow-500 transition-opacity duration-200 ${
          isDarkMode ? 'opacity-0' : 'opacity-100'
        }`} 
      />
      <MoonIcon 
        className={`absolute right-0.5 w-3 h-3 text-white transition-opacity duration-200 ${
          isDarkMode ? 'opacity-100' : 'opacity-0'
        }`} 
      />
    </button>
  );
};

export default ThemeToggle;