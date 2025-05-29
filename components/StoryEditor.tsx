

import React, { useState, useEffect } from 'react';
import { StoryFramework, Stage as StageType, Project, SubscriptionTier, ProjectVersion } from '../types'; // Added ProjectVersion
import { StageCard } from './StageCard';
import { AISuggestionModal } from './AISuggestionModal';
import { Icon } from './Icon';
import { Button } from './Button'; 
import { exportToPdf, exportToDocx, ExportOptions } from '../services/exportService'; 
import { ExportOptionsModal } from './ExportOptionsModal'; 
import { ProjectHistoryModal } from './ProjectHistoryModal'; 

interface StoryEditorProps {
  framework: StoryFramework;
  currentProject: Project | null;
  onUpdateStageContent: (stageId: string, content: string, stageName: string) => void; 
  onAcceptAllStagesContent: (contents: Record<string, string>) => void; 
  isGeneratingAllStages: boolean;
  userSubscriptionTier: SubscriptionTier;
  onOpenUpgradeModal: () => void;
  checkAndIncrementAIUsage: (type: 'singleStageGenerations' | 'clarifyingQuestions' | 'fullStoryDrafters') => boolean;
  // Version History Props
  projectVersions: ProjectVersion[];
  onOpenProjectHistory: () => void; 
  onRevertToVersion: (version: ProjectVersion) => Promise<void>;
  isLoadingProjectVersions: boolean;
  isRevertingVersionId: string | null;
  isProjectHistoryModalOpen: boolean;
  onCloseProjectHistoryModal: () => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({ 
  framework, 
  currentProject, 
  onUpdateStageContent,
  onAcceptAllStagesContent, 
  isGeneratingAllStages,
  userSubscriptionTier,
  onOpenUpgradeModal,
  checkAndIncrementAIUsage,
  projectVersions,
  onOpenProjectHistory,
  onRevertToVersion,
  isLoadingProjectVersions,
  isRevertingVersionId,
  isProjectHistoryModalOpen,
  onCloseProjectHistoryModal,
}) => {
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [aiAssistTarget, setAiAssistTarget] = useState<StageType | 'all' | null>(null);
  const [isCompletionModeForModal, setIsCompletionModeForModal] = useState(false);
  
  const [isExportOptionsModalOpen, setIsExportOptionsModalOpen] = useState(false);
  const [exportPreferences, setExportPreferences] = useState<ExportOptions>({
    includeOriginalIdea: true,
    includeFrameworkTitle: true,
    includeStageTitles: true,
    includeContinuousNarrative: false, 
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);


  const handleOpenSingleStageAISuggestions = (stageId: string) => {
    const stage = framework.stages.find(s => s.id === stageId);
    if (stage && currentProject) {
      const userContent = currentProject.stagescontent[stageId] || '';
      setAiAssistTarget({ ...stage, userContent });
      setIsAISuggestionModalOpen(true);
      setIsCompletionModeForModal(false); // Single stage is never completion mode in this context
    }
  };
  
  const handleOpenAllStagesAISuggestions = () => {
    if (!currentProject || !framework) return;

    const hasRawIdea = !!currentProject.rawstoryidea?.trim();
    const atLeastOneStageFilled = framework.stages.some(stage => !!currentProject.stagescontent[stage.id]?.trim());
    const allStagesFilled = framework.stages.every(stage => !!currentProject.stagescontent[stage.id]?.trim());

    const canUseFullDraft = hasRawIdea;
    const canUseCompletion = !hasRawIdea && atLeastOneStageFilled && !allStagesFilled;

    if (!canUseFullDraft && !canUseCompletion) {
      // This should ideally be caught by button's disabled state
      console.warn("AI Assist Full Story button clicked under invalid conditions.");
      return;
    }

    if (userSubscriptionTier === SubscriptionTier.FREE) {
      onOpenUpgradeModal();
      return;
    }
    if (!checkAndIncrementAIUsage('fullStoryDrafters')) {
      return;
    }
    
    setAiAssistTarget('all');
    setIsCompletionModeForModal(canUseCompletion); // True if !hasRawIdea && atLeastOneStageFilled && !allStagesFilled
    setIsAISuggestionModalOpen(true);
  };

  const handleCloseAISuggestionModal = () => {
    setIsAISuggestionModalOpen(false);
    setAiAssistTarget(null);
    setIsCompletionModeForModal(false);
  };

  const handleAcceptSingleStageSuggestion = (stageId: string, newContent: string) => {
    const stage = framework.stages.find(s => s.id === stageId);
    if (stage) {
        onUpdateStageContent(stageId, newContent, stage.name); 
    }
  };


  const getStoryContextForSingleStageAI = (currentStageId: string): string => {
    let context = "";
    const currentStageIndex = framework.stages.findIndex(s => s.id === currentStageId);
    
    if (currentProject?.rawstoryidea) {
        context = `Raw Story Idea:\n${currentProject.rawstoryidea}\n\n---\n\n`;
    }

    for (let i = 0; i <= currentStageIndex; i++) {
      const stage = framework.stages[i];
      const content = currentProject?.stagescontent[stage.id] || '';
      if (content.trim() && i < currentStageIndex) { 
        context += `Content for ${stage.name}:\n${content}\n\n---\n\n`;
      }
    }
    return context.trim();
  };

  const handleOpenExportOptions = () => {
    if (userSubscriptionTier === SubscriptionTier.FREE) {
      onOpenUpgradeModal();
      return;
    }
    setExportError(null);
    setIsExportOptionsModalOpen(true);
  };

  const handleCloseExportOptions = () => {
    setIsExportOptionsModalOpen(false);
  };

  const handleConfirmExport = async (format: 'pdf' | 'docx') => {
    if (!currentProject || !framework) return;
    setIsExporting(true);
    setExportError(null);
    try {
      if (format === 'pdf') {
        await exportToPdf(currentProject, framework, exportPreferences);
      } else if (format === 'docx') {
        await exportToDocx(currentProject, framework, exportPreferences);
      }
      setIsExportOptionsModalOpen(false); 
    } catch (error) {
      console.error(`${format.toUpperCase()} Export failed in StoryEditor:`, error);
      setExportError(`Failed to export as ${format.toUpperCase()}. Please try again or check console for details.`);
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!currentProject || currentProject.frameworkid !== framework.id) {
     return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-white md:bg-stone-50 pb-20 md:pb-8">
            <Icon name="BookOpen" className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4 sm:mb-6"/>
            <h2 className="text-xl sm:text-2xl font-normal text-gray-800 mb-2 sm:mb-3">No Active Story Project</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-md font-light leading-relaxed">
                Please select a story framework or a project to begin crafting your narrative. Use the menu below (on mobile) or the sidebar (on desktop).
            </p>
        </div>
    );
  }

  const API_KEY = process.env.API_KEY;
  const isProUser = userSubscriptionTier === SubscriptionTier.PRO;
  const anyOperationInProgress = isGeneratingAllStages || isExporting || !!isRevertingVersionId;

  const hasRawIdea = !!currentProject?.rawstoryidea?.trim();
  const atLeastOneStageFilled = framework.stages.some(stage => !!currentProject?.stagescontent[stage.id]?.trim());
  const allStagesFilled = framework.stages.every(stage => !!currentProject?.stagescontent[stage.id]?.trim());

  const canUseFullDraftFromIdea = hasRawIdea;
  const canUseCompletionMode = !hasRawIdea && atLeastOneStageFilled && !allStagesFilled;
  const canUseAnyFullStoryAI = canUseFullDraftFromIdea || canUseCompletionMode;
  
  const aiAssistFullStoryButtonDisabled = anyOperationInProgress || !canUseAnyFullStoryAI;
  let aiAssistFullStoryButtonTitle = "";
  if (!canUseAnyFullStoryAI) {
    aiAssistFullStoryButtonTitle = "Add a raw story idea or write content in at least one stage to enable full story AI assistance.";
  } else if (!isProUser) {
    aiAssistFullStoryButtonTitle = canUseFullDraftFromIdea 
      ? "Upgrade to Pro to use AI Assist Full Story Draft" 
      : "Upgrade to Pro to use AI Complete Remaining Stages";
  } else {
    aiAssistFullStoryButtonTitle = canUseFullDraftFromIdea 
      ? "AI Assist Full Story Draft (from idea)" 
      : "AI Complete Remaining Stages";
  }
  const aiAssistFullStoryButtonText = canUseFullDraftFromIdea ? "AI Assist Full Story" : "AI Complete Stages";


  return (
    <main className="flex-grow p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto bg-white md:bg-stone-50 pb-20 md:pb-10 lg:pb-12">
      <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-8 md:space-y-12">
        <header className="mb-6 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 flex-grow text-center sm:text-left">{currentProject.name}</h2>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 font-light">Framework: <span className="text-gray-800 font-normal">{framework.name}</span></p>
            {currentProject.rawstoryidea && (
              <details className="mt-3 text-left max-w-full bg-neutral-50 p-2 sm:p-3 rounded-md border border-neutral-200">
                <summary className="text-xs sm:text-sm text-neutral-600 font-medium cursor-pointer hover:text-sky-600">View Original Idea</summary>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 sm:mt-2 whitespace-pre-wrap font-light leading-relaxed">
                  {currentProject.rawstoryidea} 
                </p>
              </details>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-4 font-light max-w-full leading-relaxed">{framework.description}</p>
          </div>
        </header>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 md:mb-8 p-3 sm:p-4 bg-neutral-50 rounded-lg border border-neutral-200/80 shadow-sm">
            {API_KEY && (
                <Button
                    onClick={handleOpenAllStagesAISuggestions}
                    variant="accent-ghost"
                    size="sm"
                    leftIcon={<Icon name="WandSparkles" className="w-4 h-4" />}
                    disabled={aiAssistFullStoryButtonDisabled}
                    isLoading={isGeneratingAllStages && aiAssistTarget === 'all'} // Show loading for this button specifically
                    className="!text-xs sm:!text-sm w-full sm:w-auto" 
                    title={aiAssistFullStoryButtonTitle}
                >
                    {aiAssistFullStoryButtonText}
                    {!isProUser && canUseAnyFullStoryAI && <Icon name="Sparkles" className="w-3 h-3 ml-1 text-amber-400" />}
                </Button>
            )}
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
                 <Button
                    onClick={onOpenProjectHistory}
                    variant="secondary"
                    size="sm"
                    leftIcon={<Icon name="ClockArrowRotateLeft" className="w-4 h-4" />}
                    disabled={anyOperationInProgress || isLoadingProjectVersions}
                    isLoading={isLoadingProjectVersions && !isProjectHistoryModalOpen} 
                    className="!text-xs sm:!text-sm flex-1 sm:flex-none"
                    title="View Project Version History"
                  >
                    History
                  </Button>
                 <Button
                    onClick={handleOpenExportOptions}
                    variant="secondary"
                    size="sm"
                    leftIcon={<Icon name="DocumentArrowDown" className="w-4 h-4" />}
                    disabled={anyOperationInProgress}
                    isLoading={isExporting}
                    className="!text-xs sm:!text-sm flex-1 sm:flex-none"
                    title={!isProUser ? "Upgrade to Pro to Export Story" : "Export Story"}
                  >
                    Export {!isProUser && <Icon name="Sparkles" className="w-3 h-3 ml-1 text-amber-400" />}
                  </Button>
            </div>
        </div>
        
        {framework.stages.map((stage, index) => (
          <StageCard
            key={stage.id}
            stage={{...stage, userContent: currentProject.stagescontent[stage.id] || ''}}
            stageIndex={index}
            totalStages={framework.stages.length}
            onContentChange={(stageId, newContent) => onUpdateStageContent(stageId, newContent, stage.name)} 
            onOpenAISuggestions={handleOpenSingleStageAISuggestions}
          />
        ))}
      </div>

      {isAISuggestionModalOpen && currentProject && framework && aiAssistTarget && (
        <AISuggestionModal
          isOpen={isAISuggestionModalOpen}
          onClose={handleCloseAISuggestionModal}
          assistTarget={aiAssistTarget}
          
          singleStageDetails={typeof aiAssistTarget === 'object' ? aiAssistTarget : undefined}
          singleStageFrameworkId={typeof aiAssistTarget === 'object' ? currentProject.frameworkid : undefined}
          storyContextForSingleStage={typeof aiAssistTarget === 'object' ? getStoryContextForSingleStageAI(aiAssistTarget.id) : undefined}
          onAcceptSingleStageSuggestion={typeof aiAssistTarget === 'object' ? handleAcceptSingleStageSuggestion : undefined}
          
          currentProjectFramework={aiAssistTarget === 'all' ? framework : undefined}
          rawStoryIdeaForModal={aiAssistTarget === 'all' && !isCompletionModeForModal ? currentProject.rawstoryidea : undefined}
          currentProjectStagesContent={aiAssistTarget === 'all' && isCompletionModeForModal ? currentProject.stagescontent : undefined}
          isCompletionMode={aiAssistTarget === 'all' ? isCompletionModeForModal : false}
          onAcceptAllStagesSuggestion={aiAssistTarget === 'all' ? onAcceptAllStagesContent : undefined}

          isLoadingAcceptAction={isGeneratingAllStages} 
          userSubscriptionTier={userSubscriptionTier}
          checkAndIncrementAIUsage={checkAndIncrementAIUsage}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />
      )}

      {isExportOptionsModalOpen && (
        <ExportOptionsModal
          isOpen={isExportOptionsModalOpen}
          onClose={handleCloseExportOptions}
          preferences={exportPreferences}
          onPreferencesChange={setExportPreferences}
          onConfirmExport={handleConfirmExport}
          isExporting={isExporting}
          exportError={exportError}
        />
      )}

      {isProjectHistoryModalOpen && currentProject && (
        <ProjectHistoryModal
            isOpen={isProjectHistoryModalOpen}
            onClose={onCloseProjectHistoryModal}
            versions={projectVersions}
            onRevert={onRevertToVersion}
            isLoadingVersions={isLoadingProjectVersions}
            isRevertingVersionId={isRevertingVersionId}
        />
      )}
    </main>
  );
};
