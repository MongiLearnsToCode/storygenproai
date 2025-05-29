
import React, { useState, useEffect, useCallback } from 'react';
import { Stage as StageType, StoryFramework, SubscriptionTier, AIOutputMode } from '../types'; 
import { Button } from './Button';
import { MarkdownInput } from './MarkdownInput';
import { LoadingSpinner } from './LoadingSpinner';
import { getAIClarifyingQuestions, getAISuggestion, getAIAllStagesSuggestion, getAICompleteRemainingStages } from '../services/geminiService'; 
import { Icon } from './Icon';

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistTarget: StageType | 'all'; 

  // For single stage assist
  singleStageDetails?: StageType;
  singleStageFrameworkId?: string;
  storyContextForSingleStage?: string; 
  onAcceptSingleStageSuggestion?: (stageId: string, newContent: string) => void;
  
  // For 'all' stages assist (either full draft or completion)
  currentProjectFramework?: StoryFramework;
  rawStoryIdeaForModal?: string | null; // Used if !isCompletionMode
  currentProjectStagesContent?: Record<string, string>; // Used if isCompletionMode
  isCompletionMode?: boolean; // True if 'all' stages but completing existing, not from raw idea
  onAcceptAllStagesSuggestion?: (contents: Record<string, string>) => void;
  
  isLoadingAcceptAction?: boolean; // True if App.tsx is processing the accept action

  userSubscriptionTier: SubscriptionTier;
  checkAndIncrementAIUsage: (type: 'singleStageGenerations' | 'clarifyingQuestions' | 'fullStoryDrafters') => boolean;
  onOpenUpgradeModal: () => void;
}

type ModalPhase = 
  | 'idle' 
  | 'fetchingQuestions' 
  | 'answeringQuestions' 
  | 'generatingSingleStageStory' 
  | 'generatingAllStagesStory' // Covers both full draft and completion
  | 'showingSingleStageSuggestion' 
  | 'showingAllStagesSuggestion'
  | 'error'
  | 'limitReached';

export const AISuggestionModal: React.FC<AISuggestionModalProps> = ({
  isOpen,
  onClose,
  assistTarget,
  singleStageDetails,
  singleStageFrameworkId,
  storyContextForSingleStage,
  onAcceptSingleStageSuggestion,
  currentProjectFramework,
  rawStoryIdeaForModal,
  currentProjectStagesContent,
  isCompletionMode = false, // Default to false
  onAcceptAllStagesSuggestion,
  isLoadingAcceptAction,
  userSubscriptionTier,
  checkAndIncrementAIUsage,
  onOpenUpgradeModal,
}) => {
  const [currentPhase, setCurrentPhase] = useState<ModalPhase>('idle');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const [generatedSingleStageSuggestion, setGeneratedSingleStageSuggestion] = useState<string>('');
  const [generatedAllStagesContent, setGeneratedAllStagesContent] = useState<Record<string, string> | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userInstruction, setUserInstruction] = useState<string>('');
  const [currentOutputMode, setCurrentOutputMode] = useState<AIOutputMode>(AIOutputMode.CREATIVE); 

  const isAllStagesMode = assistTarget === 'all';

  const resetState = useCallback(() => {
    setCurrentPhase('idle');
    setQuestions([]);
    setAnswers([]);
    setGeneratedSingleStageSuggestion('');
    setGeneratedAllStagesContent(null);
    setErrorMessage(null);
    setUserInstruction('');
    setCurrentOutputMode(AIOutputMode.CREATIVE); 
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const handleFetchQuestions = async () => {
    if (isAllStagesMode || !singleStageDetails || !singleStageFrameworkId) return;
    if (!checkAndIncrementAIUsage('clarifyingQuestions')) return; 

    setCurrentPhase('fetchingQuestions');
    setErrorMessage(null);
    try {
      const fetchedQuestions = await getAIClarifyingQuestions(
        singleStageFrameworkId,
        singleStageDetails.name,
        singleStageDetails.description,
        storyContextForSingleStage || '',
        userInstruction || undefined 
      );
      setQuestions(fetchedQuestions);
      setAnswers(new Array(fetchedQuestions.length).fill(''));
      setCurrentPhase('answeringQuestions');
    } catch (err) {
      console.error("Error fetching questions:", err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch questions.');
      setCurrentPhase('error');
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleGenerateSuggestion = async (fromQuestionsSingleStage: boolean = false) => {
    setErrorMessage(null);

    if (isAllStagesMode) {
      if (userSubscriptionTier === SubscriptionTier.FREE) {
        onOpenUpgradeModal(); 
        onClose();
        return;
      }
      // checkAndIncrementAIUsage('fullStoryDrafters') is handled by StoryEditor before opening modal for 'all'
      
      if (!currentProjectFramework) {
        setErrorMessage("Framework details are missing for full story generation.");
        setCurrentPhase('error');
        return;
      }
      setCurrentPhase('generatingAllStagesStory');

      try {
        let allStagesResult: Record<string, string>;
        if (isCompletionMode) {
          if (!currentProjectStagesContent) {
             setErrorMessage("Existing story content is missing for completion mode.");
             setCurrentPhase('error');
             return;
          }
          const newlyGeneratedContent = await getAICompleteRemainingStages(
            currentProjectFramework,
            currentProjectStagesContent,
            currentOutputMode,
            userInstruction || undefined
          );
          allStagesResult = { ...currentProjectStagesContent, ...newlyGeneratedContent };
        } else {
          if (!rawStoryIdeaForModal) {
            setErrorMessage("Raw story idea is missing for full draft generation.");
            setCurrentPhase('error');
            return;
          }
          allStagesResult = await getAIAllStagesSuggestion(
            currentProjectFramework,
            rawStoryIdeaForModal,
            currentOutputMode,
            userInstruction || undefined
          );
        }
        setGeneratedAllStagesContent(allStagesResult);
        setCurrentPhase('showingAllStagesSuggestion');
      } catch (err) {
        console.error(`Error generating all stages suggestion (completion: ${isCompletionMode}):`, err);
        const modeText = isCompletionMode ? `completing story (${currentOutputMode} mode)` : `full story draft (${currentOutputMode} mode)`;
        setErrorMessage(err instanceof Error ? err.message : `Failed to generate ${modeText}.`);
        setCurrentPhase('error');
      }

    } else { // Single Stage Mode
      if (!checkAndIncrementAIUsage('singleStageGenerations')) return;
      
      if (!singleStageDetails || !singleStageFrameworkId) {
         setErrorMessage("Stage details or framework ID is missing for single stage generation.");
         setCurrentPhase('error');
         return;
      }
      setCurrentPhase('generatingSingleStageStory');
      const questionsAndAnswers = fromQuestionsSingleStage 
        ? questions.map((q, i) => ({ question: q, answer: answers[i] })) 
        : undefined;
      
      try {
        const suggestion = await getAISuggestion(
          singleStageFrameworkId,
          singleStageDetails.id,
          singleStageDetails.name,
          singleStageDetails.description, 
          `${storyContextForSingleStage || ''}\n\nCurrent draft for ${singleStageDetails.name}:\n${singleStageDetails.userContent || 'Not started yet.'}`,
          currentOutputMode, 
          questionsAndAnswers,
          userInstruction || undefined
        );
        setGeneratedSingleStageSuggestion(suggestion);
        setCurrentPhase('showingSingleStageSuggestion');
      } catch (err) {
        console.error("Error generating single stage suggestion:", err);
        setErrorMessage(err instanceof Error ? err.message : `Failed to generate suggestion (${currentOutputMode} mode) for this stage.`);
        setCurrentPhase('error');
      }
    }
  };

  const handleAccept = () => {
    if (isAllStagesMode && generatedAllStagesContent && onAcceptAllStagesSuggestion) {
      onAcceptAllStagesSuggestion(generatedAllStagesContent);
    } else if (!isAllStagesMode && singleStageDetails && onAcceptSingleStageSuggestion) {
      onAcceptSingleStageSuggestion(singleStageDetails.id, generatedSingleStageSuggestion);
    }
    // onClose will be called by App.tsx after async accept action finishes, or immediately if no async.
    // If isLoadingAcceptAction is true, App.tsx is handling it. Otherwise, close.
    if (!isLoadingAcceptAction) {
      onClose();
    }
  };
  
  const handleRegenerate = () => {
     if (isAllStagesMode) {
        handleGenerateSuggestion(false); 
     } else {
        handleGenerateSuggestion(currentPhase === 'showingSingleStageSuggestion' && questions.length > 0 && answers.some(a => a.trim() !== ''));
     }
  }

  if (!isOpen) return null;

  const modalTitle = isAllStagesMode 
    ? (isCompletionMode ? `AI Complete Remaining Stages: ${currentProjectFramework?.name}` : `AI Assist Full Story Draft: ${currentProjectFramework?.name}`)
    : `AI Assist: ${singleStageDetails?.name}`;
  
  const outputModeOptions = [
    { id: AIOutputMode.CREATIVE, label: 'Creative', description: 'Generate narrative content.' },
    { id: AIOutputMode.OUTLINE, label: 'Outline', description: 'Get a bullet-point structure.' },
    { id: AIOutputMode.PROMPT, label: 'Prompt', description: 'Receive guiding questions.' },
  ];

  const renderOutputModeSelector = () => (
    <div className="mb-3 sm:mb-4">
      <label className="block text-sm font-medium text-neutral-600 mb-1.5">Output Mode:</label>
      <div className="flex flex-col sm:flex-row gap-2 rounded-md bg-neutral-100 p-1">
        {outputModeOptions.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => setCurrentOutputMode(option.id)}
            className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-100
                        ${currentOutputMode === option.id 
                          ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-700' 
                          : 'bg-white text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 hover:border-neutral-300'}`}
            aria-pressed={currentOutputMode === option.id}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
       <p className="text-xs text-neutral-500 mt-1.5 px-1">
          {outputModeOptions.find(opt => opt.id === currentOutputMode)?.description}
        </p>
    </div>
  );

  const idleContentUserInstructionPlaceholder = 
    currentOutputMode === AIOutputMode.OUTLINE ? "e.g., 'Focus on 3 key turning points'" :
    currentOutputMode === AIOutputMode.PROMPT ? "e.g., 'Help me explore the subtext of this scene'" :
    (isAllStagesMode && !isCompletionMode) ? "e.g., 'Maintain a humorous tone', 'Target audience: young adults'" : 
    (isAllStagesMode && isCompletionMode) ? "e.g., 'Ensure the completed parts lead to a surprising twist'" :
    "e.g., 'Focus on dialogue', 'Make it more suspenseful'";

  const idleContentDescription = 
    isAllStagesMode 
      ? (isCompletionMode 
          ? `AI will complete the remaining stages in ${currentOutputMode} mode, using your existing content as context.`
          : `Provide overall instructions and let AI draft the entire story in ${currentOutputMode} mode based on your raw idea.`)
      : `Current stage content will be used as context. How can AI help in ${currentOutputMode} mode?`;

  const renderIdleContent = () => (
    <>
      {renderOutputModeSelector()}
      <MarkdownInput
        label={`Optional: Specific instructions for AI ${isAllStagesMode ? `(for entire story - ${currentOutputMode} mode)` : `(for this stage - ${currentOutputMode} mode)`}`}
        value={userInstruction}
        onChange={(e) => setUserInstruction(e.target.value)}
        placeholder={idleContentUserInstructionPlaceholder}
        rows={2}
        className="text-sm"
        style={{ backgroundColor: '#fdfdfd' }}
      />
      <p className="text-xs sm:text-sm text-neutral-500 mb-2 sm:mb-3">
        {idleContentDescription}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {!isAllStagesMode && (
          <Button variant="secondary" onClick={handleFetchQuestions} className="flex-1 text-xs sm:text-sm" leftIcon={<Icon name="Lightbulb" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}>
            Suggest Clarifying Questions
          </Button>
        )}
        <Button variant="primary" onClick={() => handleGenerateSuggestion(false)} className="flex-1 text-xs sm:text-sm" leftIcon={<Icon name={isAllStagesMode ? "WandSparkles" : "Sparkles"} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}>
          {isAllStagesMode 
            ? (isCompletionMode ? `Complete Remaining Stages (${currentOutputMode})` :`Generate Full Story (${currentOutputMode})`)
            : `Generate Stage Content (${currentOutputMode})`}
        </Button>
      </div>
    </>
  );

  const renderLoadingContent = () => {
    let text = `AI is working in ${currentOutputMode} mode...`;
    if (currentPhase === 'fetchingQuestions') text = "AI is thinking of insightful questions...";
    if (currentPhase === 'generatingSingleStageStory') text = `AI is crafting your stage content (${currentOutputMode} mode)...`;
    if (currentPhase === 'generatingAllStagesStory') {
      text = isCompletionMode 
        ? `AI is completing the remaining stages (${currentOutputMode} mode)...` 
        : `AI is drafting your full story (${currentOutputMode} mode)...`;
    }
    return (
      <div className="py-8 sm:py-10">
        <LoadingSpinner text={text} />
      </div>
    );
  };

  const renderAnsweringQuestionsContent = () => (
     <>
      <p className="text-sm text-neutral-700 mb-1">Answer these questions to help the AI generate a more tailored suggestion for <strong>{singleStageDetails?.name}</strong> (in {currentOutputMode} mode):</p>
      {userInstruction && <p className="text-xs text-neutral-500 mb-2 sm:mb-3">Considering your instruction: "{userInstruction}"</p>}
      <div className="space-y-3 sm:space-y-4 max-h-[40vh] overflow-y-auto pr-1 sm:pr-2">
        {questions.map((q, i) => (
          <MarkdownInput
            key={i}
            label={`Q${i + 1}: ${q}`}
            value={answers[i]}
            onChange={(e) => handleAnswerChange(i, e.target.value)}
            rows={2}
            placeholder="Your thoughts..."
            className="text-sm"
            style={{ backgroundColor: '#fdfdfd' }}
          />
        ))}
      </div>
    </>
  );
  
  const renderSingleStageSuggestion = () => (
    <>
      <p className="text-sm text-neutral-700 mb-1 sm:mb-2">AI Generated Suggestion for <strong>{singleStageDetails?.name}</strong> ({currentOutputMode} mode):</p>
      <div 
        className="bg-neutral-50 p-2.5 sm:p-3 rounded-md border border-neutral-200 max-h-[40vh] sm:max-h-[45vh] overflow-y-auto prose prose-xs sm:prose-sm prose-neutral prose-p:my-1 prose-headings:my-2 prose-headings:text-neutral-700 prose-strong:text-neutral-700 prose-a:text-sky-600 hover:prose-a:text-sky-700 whitespace-pre-wrap" 
      >
        {generatedSingleStageSuggestion}
      </div>
    </>
  );

  const renderAllStagesSuggestion = () => (
    <>
      <p className="text-sm text-neutral-700 mb-1 sm:mb-2">
        {isCompletionMode ? "AI Generated Content for Remaining Stages" : "AI Generated Full Story Draft"} for <strong>{currentProjectFramework?.name}</strong> ({currentOutputMode} mode):
      </p>
      <div className="bg-neutral-50 p-2.5 sm:p-3 rounded-md border border-neutral-200 max-h-[40vh] sm:max-h-[45vh] overflow-y-auto space-y-3">
        {currentProjectFramework && generatedAllStagesContent ? (
          currentProjectFramework.stages.map(stage => (
            <div key={stage.id}>
              <h4 className="text-xs font-semibold text-sky-700 mb-0.5">{stage.name}</h4>
              <p className="text-xs text-neutral-600 whitespace-pre-wrap p-1.5 bg-white/50 border border-neutral-200/50 rounded-sm shadow-sm">
                {generatedAllStagesContent[stage.id] || <span className="italic text-neutral-400">No content for this stage.</span>}
              </p>
            </div>
          ))
        ) : (
          <p className="text-neutral-500 italic">Preview not available or content generation failed for some stages.</p>
        )}
      </div>
       <p className="text-xs text-neutral-500 mt-2">
         {isCompletionMode ? "Review the generated content. Accepting will update the empty stages of your project." : "Review the generated content. Accepting will update all stages of your project."}
       </p>
    </>
  );

  const renderLimitReachedContent = () => (
    <div className="p-3 text-center">
        <Icon name="ExclamationTriangle" className="w-10 h-10 text-amber-500 mx-auto mb-3"/>
        <h3 className="text-md font-semibold text-neutral-700 mb-1">Daily Limit Reached</h3>
        <p className="text-sm text-neutral-600 mb-3">
            You've used all your free AI assists for today for this feature.
        </p>
        <p className="text-sm text-neutral-600 mb-4">
            Upgrade to Pro for significantly more AI power, unlimited projects, and story exports!
        </p>
        <Button variant="primary" onClick={() => { onOpenUpgradeModal(); onClose(); }} className="w-full sm:w-auto">
            Upgrade to Pro
        </Button>
    </div>
  );

  const acceptButtonText = isAllStagesMode 
    ? (isCompletionMode ? 'Accept Completed Stages' : 'Accept Full Draft')
    : 'Accept & Use This';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]"
      onClick={isLoadingAcceptAction ? undefined : onClose} // Prevent closing if accept is loading
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      <div 
        className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col border border-neutral-200 text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 id="ai-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-700 truncate pr-2">{modalTitle}</h2>
          <Button variant="ghost" size="sm" onClick={isLoadingAcceptAction ? undefined : onClose} aria-label="Close modal" className="!p-1.5 sm:!p-2 text-neutral-500 hover:text-neutral-700" disabled={isLoadingAcceptAction}>
            <Icon name="XMark" className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-grow pr-1 sm:pr-2 space-y-3 sm:space-y-4">
          {currentPhase === 'idle' && renderIdleContent()}
          {(currentPhase === 'fetchingQuestions' || currentPhase === 'generatingSingleStageStory' || currentPhase === 'generatingAllStagesStory') && renderLoadingContent()}
          {currentPhase === 'answeringQuestions' && questions.length > 0 && !isAllStagesMode && renderAnsweringQuestionsContent()}
          {currentPhase === 'showingSingleStageSuggestion' && !isAllStagesMode && renderSingleStageSuggestion()}
          {currentPhase === 'showingAllStagesSuggestion' && isAllStagesMode && renderAllStagesSuggestion()}
          {currentPhase === 'limitReached' && renderLimitReachedContent()}
          
          {currentPhase === 'error' && errorMessage && (
            <div className="p-2.5 sm:p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
              <p className="font-semibold text-sm">An Error Occurred:</p>
              <p className="text-xs sm:text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          {currentPhase === 'answeringQuestions' && !isAllStagesMode && (
             <>
                <Button variant="ghost" onClick={onClose} className="order-2 sm:order-1 text-xs sm:text-sm">Cancel</Button>
                <Button variant="primary" onClick={() => handleGenerateSuggestion(true)} className="order-1 sm:order-2 text-xs sm:text-sm" leftIcon={<Icon name="Sparkles" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}>
                  Generate with My Answers
                </Button>
             </>
          )}
          {(currentPhase === 'showingSingleStageSuggestion' || currentPhase === 'showingAllStagesSuggestion') && (
            <>
              <Button 
                variant="secondary" 
                onClick={handleRegenerate} 
                className="order-2 sm:order-1 text-xs sm:text-sm" 
                leftIcon={<Icon name={isAllStagesMode ? "WandSparkles" : "Sparkles"} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}
                disabled={isLoadingAcceptAction}
              >
                Regenerate ({currentOutputMode})
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAccept} 
                className="order-1 sm:order-2 text-xs sm:text-sm" 
                leftIcon={<Icon name="Check" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}
                isLoading={isLoadingAcceptAction} 
                disabled={isLoadingAcceptAction}
              >
                {acceptButtonText}
              </Button>
            </>
          )}
          {(currentPhase === 'idle' || currentPhase === 'error' || currentPhase === 'limitReached') && (
            <Button variant="ghost" onClick={onClose} className="text-xs sm:text-sm">
              {currentPhase === 'error' || currentPhase === 'limitReached' ? 'Close' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
