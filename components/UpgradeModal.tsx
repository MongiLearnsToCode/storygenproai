
import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { AI_LIMITS, SubscriptionTier } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  sourceFeature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  sourceFeature,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const getSourceMessage = () => {
    switch (sourceFeature) {
      case 'export':
        return 'Unlock story exports (PDF & DOCX) by upgrading to Pro.';
      case 'ai_full_story':
      case 'ai_limit_fullstorydrafters':
        return 'Generate full story drafts with AI Assist by upgrading to Pro.';
      case 'project_limit':
        return `You've reached the ${AI_LIMITS[SubscriptionTier.FREE].projects} project limit for the Free plan. Upgrade to Pro for unlimited projects!`;
      case 'ai_limit_singlestagegenerations':
        return "You've reached your daily limit for AI story segment generation. Upgrade to Pro for more!";
      case 'ai_limit_clarifyingquestions':
        return "You've reached your daily limit for AI question suggestions. Upgrade to Pro for more!";
      case 'header_upgrade_button':
        return 'Supercharge your storytelling with StoryGenPro Pro features.';
      case 'sidebar_action':
         return 'Access this Pro feature by upgrading your plan.';
      case 'editor_action':
        return 'This feature requires a Pro plan. Upgrade to unlock it now.';
      default:
        return 'Unlock all premium features by upgrading to StoryGenPro Pro.';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[200]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md text-neutral-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5 sm:mb-6">
          <Icon name="Sparkles" className="w-10 h-10 sm:w-12 sm:h-12 text-sky-500 mx-auto mb-3" />
          <h2 id="upgrade-modal-title" className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1.5">
            Go Pro!
          </h2>
          <p className="text-sm text-neutral-600">
            {getSourceMessage()}
          </p>
        </div>

        <ul className="space-y-2 text-sm text-neutral-700 mb-6 sm:mb-8">
          <li className="flex items-center">
            <Icon name="Check" className="w-4 h-4 text-green-500 mr-2.5 shrink-0" />
            Unlimited Story Projects
          </li>
          <li className="flex items-center">
            <Icon name="Check" className="w-4 h-4 text-green-500 mr-2.5 shrink-0" />
            Full Story Export (PDF & DOCX)
          </li>
          <li className="flex items-center">
            <Icon name="Check" className="w-4 h-4 text-green-500 mr-2.5 shrink-0" />
            Greatly Increased AI Assist Limits
          </li>
          <li className="flex items-center">
            <Icon name="Check" className="w-4 h-4 text-green-500 mr-2.5 shrink-0" />
            AI Assist Full Story Drafts
          </li>
        </ul>
        
        <div className="mb-5 sm:mb-6">
          <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Button
              variant={selectedPlan === 'monthly' ? 'primary' : 'secondary'}
              onClick={() => setSelectedPlan('monthly')}
              className="flex-1 !py-2 !text-sm"
              aria-pressed={selectedPlan === 'monthly'}
            >
              Monthly
            </Button>
            <Button
              variant={selectedPlan === 'annual' ? 'primary' : 'secondary'}
              onClick={() => setSelectedPlan('annual')}
              className="flex-1 !py-2 !text-sm"
              aria-pressed={selectedPlan === 'annual'}
            >
              Annual
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-neutral-800">
              {selectedPlan === 'monthly' ? '$9.99' : '$99'}
              <span className="text-base font-normal text-neutral-500 align-baseline">
                {selectedPlan === 'monthly' ? '/month' : '/year'}
              </span>
            </p>
            {selectedPlan === 'annual' && (
              <p className="text-xs text-green-600 mt-1">
                Save ~16%! (Billed as one payment of $99)
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-2.5 sm:space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onUpgrade}
            className="w-full !py-2.5 sm:!py-3 text-base"
          >
            Upgrade to Pro
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-sm text-neutral-500 hover:text-neutral-700"
          >
            Maybe Later
          </Button>
        </div>
        <p className="text-xs text-neutral-400 mt-4 text-center">
          This is a simulated upgrade for demonstration purposes.
        </p>
      </div>
    </div>
  );
};
