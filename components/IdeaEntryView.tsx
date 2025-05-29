
import React, { useState, useRef } from 'react';
import { StoryFramework, UserProfile } from '../types'; // Added UserProfile
import { MarkdownInput } from './MarkdownInput';
import { Button } from './Button';
import { Icon } from './Icon';
import { STORY_FRAMEWORKS } from '../constants';
import type { User } from '@supabase/supabase-js';

interface IdeaEntryViewProps {
  rawStoryIdea: string;
  onIdeaChange: (idea: string) => void;
  frameworks: StoryFramework[]; 
  onSelectFramework: (frameworkId: string) => void;
  isMapping: boolean;
  mappingError: string | null;
  apiKeyMissing: boolean;
  currentUser: User | null;
  userProfile: UserProfile | null; // Added userProfile
}

export const IdeaEntryView: React.FC<IdeaEntryViewProps> = ({
  rawStoryIdea,
  onIdeaChange,
  onSelectFramework,
  isMapping,
  mappingError,
  apiKeyMissing,
  currentUser,
  userProfile, // Destructure userProfile
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    if (hour >= 17) timeOfDay = "evening";
    
    const nameToUse = userProfile?.display_name?.trim() || currentUser?.email?.split('@')[0] || "Storyteller";
    return `Good ${timeOfDay}, ${nameToUse}.`;
  };

  const isIdeaEmpty = !rawStoryIdea.trim();

  const [showAutoSelectHint, setShowAutoSelectHint] = useState<boolean>(false);
  const autoSelectHintShownRef = useRef<boolean>(false);

  const handleAutoSelectFrameworkClick = () => {
    if (isIdeaEmpty || apiKeyMissing || isMapping) return;

    const randomIndex = Math.floor(Math.random() * STORY_FRAMEWORKS.length);
    const randomFramework = STORY_FRAMEWORKS[randomIndex];
    if (randomFramework) {
      onSelectFramework(randomFramework.id);

      if (!autoSelectHintShownRef.current) {
        setShowAutoSelectHint(true);
        autoSelectHintShownRef.current = true;
        setTimeout(() => {
          setShowAutoSelectHint(false);
        }, 3500);
      }
    }
  };
  
  const handleMicrophoneClick = () => {
    console.log("Microphone icon clicked (placeholder)");
    alert("Microphone input is not yet implemented.");
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-stone-50 text-neutral-800 selection:bg-sky-200 selection:text-sky-700 pb-20 md:pb-8">
      <div className="w-full max-w-xl md:max-w-2xl flex flex-col items-center space-y-6 md:space-y-8">

        <header className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-700">
            {getGreeting()}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-neutral-500">
            What story are we crafting today?
          </p>
        </header>

        <div className="w-full bg-white p-3 sm:p-4 rounded-xl md:rounded-2xl shadow-xl border border-neutral-200/70">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-grow">
              <MarkdownInput
                id="mainQueryInput"
                value={rawStoryIdea}
                onChange={(e) => onIdeaChange(e.target.value)}
                placeholder="Type your raw story idea or a central theme here..."
                className="bg-transparent border-none focus:ring-0 focus:border-none p-2 text-sm sm:text-base md:text-lg text-neutral-700 placeholder:text-neutral-400 min-h-[60px] sm:min-h-[80px] resize-none"
                rows={3} 
                disabled={isMapping}
                aria-label="Main query input or story idea"
              />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-200/60 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button 
                type="button" 
                aria-label="Use microphone" 
                onClick={handleMicrophoneClick}
                disabled={isMapping}
                className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-white">
                <Icon name="Microphone" className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAutoSelectFrameworkClick}
                disabled={isMapping || isIdeaEmpty || apiKeyMissing}
                className="p-2 sm:p-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white disabled:bg-neutral-300 disabled:text-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-white"
                aria-label="Let the system select a framework for you"
                title={apiKeyMissing ? "AI features disabled: API Key missing" : (isIdeaEmpty ? "Enter story idea to use AI select" : "Let the system select a framework for you")}
              >
                <Icon name="Sparkles" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="w-full text-center space-y-2 sm:space-y-3 pt-2 sm:pt-4">
          {!isMapping && (
            <p className={`text-xs sm:text-sm text-neutral-500 ${isIdeaEmpty && !apiKeyMissing ? 'animate-pulse' : ''}`}>
              {apiKeyMissing 
                ? "AI mapping disabled. Manual framework selection required."
                : (isIdeaEmpty 
                  ? "Type your story idea above, then select a framework below to begin." 
                  : "Select a framework below, or let us choose for you with the ✨ button (top right of input)!")
              }
            </p>
          )}
          {showAutoSelectHint && (
            <p className="text-xs text-sky-600 font-medium p-1 bg-sky-50 rounded-md shadow animate-pulse">
              Hint: The <Icon name="Sparkles" className="w-3 h-3 inline align-middle" /> button automatically selects a framework for your idea.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {STORY_FRAMEWORKS.map(framework => (
              <Button
                key={framework.id}
                variant={(isIdeaEmpty && !apiKeyMissing) || isMapping ? "secondary" : "primary"}
                size="sm"
                className="rounded-full !px-3 !py-1.5 sm:!px-4 sm:!py-2 text-xs sm:text-sm !font-medium hover:shadow-md"
                onClick={() => onSelectFramework(framework.id)}
                disabled={isMapping || (isIdeaEmpty && !apiKeyMissing)} 
                aria-label={`Start with ${framework.name}`}
                title={(isIdeaEmpty && !apiKeyMissing) ? "Please enter your story idea first" : `Start with ${framework.name}`}
              >
                {framework.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl md:max-w-2xl mt-6 md:mt-10 space-y-3">
          {apiKeyMissing && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-lg text-xs sm:text-sm w-full shadow-sm">
              <p><span className="font-semibold">Warning:</span> The Gemini API Key is not configured.
              AI-powered features (like idea mapping) will not be available. You can still select a framework and fill it manually.
              Ensure the <code>API_KEY</code> environment variable is set up for full functionality.</p>
            </div>
          )}

          {mappingError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 rounded-lg w-full shadow-sm">
              <p className="font-semibold text-sm">Mapping Error:</p>
              <p className="text-xs sm:text-sm">{mappingError}</p>
              <p className="text-xs mt-1">You can try selecting a framework again, modify your idea, or select a framework to manually fill the stages.</p>
            </div>
          )}
      </div>

    </div>
  );
};
