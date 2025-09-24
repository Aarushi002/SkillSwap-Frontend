import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  UserGroupIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import ThemeToggle from '../components/UI/ThemeToggle';

const HomePage = () => {
  const [stats, setStats] = useState({
    activeLearners: 10000,
    skillsAvailable: 500,
    successfulExchanges: 50000
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values if API fails
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helper function to format numbers with commas and + suffix
  const formatNumber = (num) => {
    return num.toLocaleString() + '+';
  };

  const features = [
    {
      name: 'Skill Discovery',
      description: 'Find people with the skills you want to learn and offer your expertise in return.',
      icon: UserGroupIcon,
    },
    {
      name: 'Smart Matching',
      description: 'Our Tinder-like algorithm connects you with the perfect skill exchange partners.',
      icon: BoltIcon,
    },
    {
      name: 'Secure Platform',
      description: 'Safe and verified community with ratings and reviews for every member.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Real-time Messaging',
      description: 'Chat with your matches and schedule sessions seamlessly.',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Token System',
      description: 'Fair exchange system with virtual tokens to reward great teachers.',
      icon: CurrencyDollarIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900 dark:to-secondary-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">SkillSwap Hub</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
              Exchange Skills,
              <span className="text-primary-600 dark:text-primary-400"> Build Communities</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              Join the peer-to-peer marketplace where knowledge meets opportunity. 
              Learn new skills while teaching what you know best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Start Learning Today
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors"
              >
                Explore Skills
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-b from-primary-100/20 dark:from-primary-800/20 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How SkillSwap Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform makes skill exchange simple, safe, and rewarding for everyone involved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.name} className="relative p-6 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.name}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-primary-500 dark:bg-primary-700 h-10 w-24 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats.activeLearners)
                )}
              </div>
              <div className="text-primary-100 dark:text-primary-200">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-primary-500 dark:bg-primary-700 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats.skillsAvailable)
                )}
              </div>
              <div className="text-primary-100 dark:text-primary-200">Skills Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-primary-500 dark:bg-primary-700 h-10 w-28 mx-auto rounded"></div>
                ) : (
                  formatNumber(stats.successfulExchanges)
                )}
              </div>
              <div className="text-primary-100 dark:text-primary-200">Successful Exchanges</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Ready to Start Your Skill Journey?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of learners and teachers in our vibrant community. 
            Your next skill is just a match away.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-500 dark:hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors"
          >
            Join SkillSwap Hub
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-lg font-semibold mb-4">SkillSwap Hub</div>
          <p className="text-gray-400 dark:text-gray-500">
            © 2025 SkillSwap Hub. Connecting learners and teachers worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
