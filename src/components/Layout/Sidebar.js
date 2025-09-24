import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  WalletIcon,
  UserIcon,
  BellIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Discover', href: '/discover', icon: MagnifyingGlassIcon },
    { name: 'Matches', href: '/matches', icon: HeartIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Sessions', href: '/sessions', icon: CalendarIcon },
    { name: 'Wallet', href: '/wallet', icon: WalletIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full pt-16">
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-2 border-primary-700 dark:border-primary-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive 
                          ? 'text-primary-500 dark:text-primary-400' 
                          : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
