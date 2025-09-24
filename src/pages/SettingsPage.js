import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  BellIcon,
  EyeIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      newMatches: true,
      messages: true,
      sessionReminders: true,
      paymentAlerts: true,
      marketingEmails: false
    },
    privacy: {
      profileVisibility: 'public',
      showLocation: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
      showSkillRatings: true
    },
    location: {
      city: '',
      country: '',
      timezone: '',
      searchRadius: 25
    },
    preferences: {
      currency: 'USD',
      language: 'en',
      theme: 'light',
      defaultAvailability: 'available'
    },
    account: {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 30,
      dataRetention: 12
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/users/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        notifications: {
          email: true,
          push: true,
          sms: false,
          newMatches: true,
          messages: true,
          sessionReminders: true,
          paymentAlerts: true,
          marketingEmails: false
        },
        privacy: {
          profileVisibility: 'public',
          showLocation: true,
          showOnlineStatus: true,
          allowDirectMessages: true,
          showSkillRatings: true
        },
        location: {
          city: '',
          country: '',
          timezone: '',
          searchRadius: 25
        },
        preferences: {
          currency: 'USD',
          language: 'en',
          theme: 'light',
          defaultAvailability: 'available'
        },
        account: {
          twoFactorEnabled: false,
          loginAlerts: true,
          sessionTimeout: 30,
          dataRetention: 12
        }
      });
      toast.success('Settings reset to defaults');
    }
  };

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: EyeIcon },
    { id: 'location', name: 'Location', icon: MapPinIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
    { id: 'account', name: 'Account Security', icon: ShieldCheckIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Manage your account preferences and privacy settings</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckCircleIcon className="h-5 w-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:space-x-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 mb-8 lg:mb-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <BellIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Delivery Methods</h3>
                      {Object.entries({
                        email: 'Email notifications',
                        push: 'Push notifications',
                        sms: 'SMS notifications'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications[key]}
                            onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Activity Types</h3>
                      {Object.entries({
                        newMatches: 'New skill matches',
                        messages: 'New messages',
                        sessionReminders: 'Session reminders'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications[key]}
                            onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Other</h3>
                      {Object.entries({
                        paymentAlerts: 'Payment alerts',
                        marketingEmails: 'Marketing emails'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications[key]}
                            onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <EyeIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy Controls</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Visibility</label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="public">Public - Anyone can see</option>
                      <option value="matches">Matches only</option>
                      <option value="private">Private - Hidden</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries({
                      showLocation: 'Show my location to others',
                      showOnlineStatus: 'Show when I\'m online',
                      allowDirectMessages: 'Allow direct messages',
                      showSkillRatings: 'Show my skill ratings'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.privacy[key]}
                          onChange={(e) => updateSetting('privacy', key, e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <MapPinIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Location Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        value={settings.location.city}
                        onChange={(e) => updateSetting('location', 'city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                      <input
                        type="text"
                        value={settings.location.country}
                        onChange={(e) => updateSetting('location', 'country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                      <select
                        value={settings.location.timezone}
                        onChange={(e) => updateSetting('location', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select timezone</option>
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="CST">Central Time</option>
                        <option value="MST">Mountain Time</option>
                        <option value="PST">Pacific Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Radius ({settings.location.searchRadius} miles)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={settings.location.searchRadius}
                        onChange={(e) => updateSetting('location', 'searchRadius', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>5 miles</span>
                        <span>100 miles</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <Cog6ToothIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">General Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                      <select
                        value={settings.preferences.currency}
                        onChange={(e) => updateSetting('preferences', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                      <select
                        value={settings.preferences.theme}
                        onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Availability</label>
                      <select
                        value={settings.preferences.defaultAvailability}
                        onChange={(e) => updateSetting('preferences', 'defaultAvailability', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="away">Away</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Security Tab */}
            {activeTab === 'account' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Security</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          We recommend enabling two-factor authentication for enhanced security.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.account.twoFactorEnabled}
                        onChange={(e) => updateSetting('account', 'twoFactorEnabled', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Login Alerts</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified of new login attempts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.account.loginAlerts}
                        onChange={(e) => updateSetting('account', 'loginAlerts', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                      />
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session Timeout ({settings.account.sessionTimeout} minutes)
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        value={settings.account.sessionTimeout}
                        onChange={(e) => updateSetting('account', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>15 min</span>
                        <span>2 hours</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Retention ({settings.account.dataRetention} months)
                      </label>
                      <select
                        value={settings.account.dataRetention}
                        onChange={(e) => updateSetting('account', 'dataRetention', parseInt(e.target.value))}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={6}>6 months</option>
                        <option value={12}>12 months</option>
                        <option value={24}>24 months</option>
                        <option value={36}>36 months</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
