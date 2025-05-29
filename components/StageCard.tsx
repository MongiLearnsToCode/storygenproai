import React from 'react';
import { Stage } from '../types';
import { MarkdownInput } from './MarkdownInput';
import { Button } from './Button';
import { Icon } from './Icon';

interface StageCardProps {
  stage: Stage;
  stageIndex: number;
  totalStages: number;
  onContentChange: (stageId: string, newContent: string) => void;
  onOpenAISuggestions: (stageId: string) => void;
}

export const StageCard: React.FC<StageCardProps> = ({ 
  stage, 
  stageIndex,
  totalStages,
  onContentChange, 
  onOpenAISuggestions 
}) => {
  const cleanStageName = (name: string): string => {
    return name.replace(/^\s*(?:\d+\.\s*|Stage\s*\d+:\s*)\s*/, '');
  };

  const placeholderText = `Craft the "${cleanStageName(stage.name)}" part of your story here...`;

  return (
    <div 
      className="bg-neutral-100 p-4 sm:p-6 md:p-8 rounded-lg border border-neutral-300 transition-all duration-300 
                 hover:border-sky-400 hover:shadow-[0_8px_25px_-5px_rgba(14,165,233,0.25),0_4px_6px_-4px_rgba(14,165,233,0.15)]"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4 sm:mb-6 gap-2 sm:gap-4">
        <div className="flex-grow">
          <h3 className="text-lg sm:text-xl font-normal text-neutral-800 mb-1 sm:mb-2">{stage.name}</h3>
          <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">{stage.description}</p>
        </div>
        <span className="text-xs text-neutral-500 bg-neutral-50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-light self-start sm:self-auto whitespace-nowrap">
          Stage {stageIndex + 1} of {totalStages}
        </span>
      </div>
      
      <MarkdownInput
        id={`stage-${stage.id}`}
        value={stage.userContent}
        onChange={(e) => onContentChange(stage.id, e.target.value)}
        placeholder={placeholderText}
        className="text-sm sm:text-base text-neutral-700 placeholder:text-neutral-400 border-neutral-300 focus:border-sky-500 selection:bg-sky-500 selection:text-neutral-50"
        style={{ backgroundColor: '#fdfdfd' }}
      />
      <div className="mt-4 sm:mt-6 flex justify-end">
        <Button 
          onClick={() => onOpenAISuggestions(stage.id)}
          variant="primary"
          size="sm"
          leftIcon={<Icon name="Sparkles" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}
          className="!text-xs sm:!text-sm" // Ensure button text size is responsive
        >
          AI Assist
        </Button>
      </div>
    </div>
  );
};