

import React from 'react';
import { Icon } from './Icon';
import { Button } from './Button';
// Fix: Use `import type { Session } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import { SubscriptionTier } from '../types'; // Import SubscriptionTier

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
  userSubscriptionTier: SubscriptionTier;
  onOpenUpgradeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, onLogout, userSubscriptionTier, onOpenUpgradeModal }) => {
  const planName = userSubscriptionTier === SubscriptionTier.PRO ? 'Pro Plan' : 'Free Plan';

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm p-3 sm:p-4 sticky top-0 z-50 border-b border-neutral-200/70">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Icon name="BookOpen" className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600 mr-2 sm:mr-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-700 tracking-tight">
            StoryGen<span className="text-sky-600">Pro</span>
          </h1>
        </div>
        {session && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-neutral-600 truncate max-w-[150px] lg:max-w-[250px] block" title={session.user.email}>
                {session.user.email}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                ${userSubscriptionTier === SubscriptionTier.PRO ? 'bg-sky-100 text-sky-700' : 'bg-neutral-200 text-neutral-600'}`}>
                {planName}
              </span>
            </div>
            {userSubscriptionTier === SubscriptionTier.FREE && (
              <Button 
                onClick={onOpenUpgradeModal}
                variant="primary" 
                size="sm" 
                className="!px-2.5 !py-1 sm:!px-3 sm:!py-1.5 text-xs"
                leftIcon={<Icon name="Sparkles" className="w-3.5 h-3.5" />}
              >
                Upgrade
              </Button>
            )}
            <Button onClick={onLogout} variant="secondary" size="sm" className="!px-2.5 !py-1 sm:!px-3 sm:!py-1.5 text-xs">
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};