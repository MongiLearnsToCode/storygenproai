
import React from 'react';
import { Icon } from './Icon';

interface BottomNavBarProps {
  onOpenMobileMenu: (view: 'frameworks' | 'projects') => void;
  onStartNewStory: () => void;
  // onGoHome prop removed
  activeView: 'frameworks' | 'projects' | 'new'; // Updated activeView type
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ 
  onOpenMobileMenu, 
  onStartNewStory,
  activeView 
}) => {
  const navItems = [
    // { id: 'home', label: 'Idea', icon: 'Lightbulb', action: onGoHome, viewType: 'home' }, // Removed
    { id: 'frameworks', label: 'Frameworks', icon: 'Grid', action: () => onOpenMobileMenu('frameworks'), viewType: 'frameworks' as const },
    { id: 'new', label: 'New Story', icon: 'PlusCircle', action: onStartNewStory, viewType: 'new' as const },
    { id: 'projects', label: 'Projects', icon: 'ClockHistory', action: () => onOpenMobileMenu('projects'), viewType: 'projects' as const },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-50 border-t border-neutral-300 shadow-top-md z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={item.action}
            className={`flex flex-col items-center justify-center p-2 rounded-lg space-y-0.5 flex-1
                        ${activeView === item.viewType ? 'text-sky-600' : 'text-neutral-500 hover:text-sky-500'} 
                        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-neutral-50`}
            aria-label={item.label}
            aria-current={activeView === item.viewType ? 'page' : undefined}
          >
            <Icon name={item.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};