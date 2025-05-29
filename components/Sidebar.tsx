
import React from 'react';
import { STORY_FRAMEWORKS } from '../constants';
import { StoryFramework, Project, SubscriptionTier } from '../types'; // Added SubscriptionTier
import { Button } from './Button';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';


interface SidebarProps {
  selectedFrameworkId: string | null;
  currentProjectId: string | null;
  onSelectFramework: (frameworkId: string) => void;
  onStartNewStory: () => void;
  onLoadProject: (projectId: string) => void;
  projectHistory: Project[];
  isProcessing: boolean; 
  onAttemptDeleteProject: (projectId: string) => void;
  projectDeletingId: string | null; 
  isProcessingDelete: boolean;
  userSubscriptionTier: SubscriptionTier; // Added
  onOpenUpgradeModal: () => void; // Added
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedFrameworkId,
  currentProjectId,
  onSelectFramework,
  onStartNewStory,
  onLoadProject,
  projectHistory,
  isProcessing, 
  onAttemptDeleteProject,
  projectDeletingId,
  isProcessingDelete,
  userSubscriptionTier, // Destructure
  onOpenUpgradeModal, // Destructure
}) => {
  const handleFrameworkClick = (frameworkId: string) => {
    // Project limit check is handled in App.tsx's onSelectFramework
    if (isProcessing) return;
    onSelectFramework(frameworkId);
  };

  const handleLoadProjectClick = (projectId: string) => {
    if (isProcessing && (projectDeletingId === projectId && isProcessingDelete)) return; 
    if (isProcessing && projectDeletingId && projectDeletingId !== projectId) return; 
    if (isProcessing && !projectDeletingId) return; 
    
    onLoadProject(projectId);
  }
  
  const handleStartNewStoryClick = () => {
    // Project limit check is handled in App.tsx's onStartNewStory
    if (isProcessing) return;
    onStartNewStory();
  }

  return (
    <aside 
      className={`
        bg-neutral-100 p-4 sm:p-5 border-r border-neutral-200/80 flex-col space-y-5 overflow-y-auto shadow-lg 
        hidden md:flex md:w-72 md:z-auto md:sticky md:top-0 md:h-screen
      `}
      aria-hidden={typeof window !== 'undefined' && window.innerWidth < 768}
    >
      <div>
        <Button 
          variant="primary" 
          className="w-full" 
          onClick={handleStartNewStoryClick}
          leftIcon={<Icon name="PlusCircle" className="w-5 h-5" />}
          disabled={isProcessing} 
        >
          Start New Story
        </Button>
      </div>

      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-neutral-500 mb-2 sm:mb-3 tracking-wide uppercase">
          Start with a Framework
        </h2>
        <ul className="space-y-1 sm:space-y-1.5">
          {STORY_FRAMEWORKS.map((framework: StoryFramework) => (
            <li key={framework.id}>
              <button
                onClick={() => handleFrameworkClick(framework.id)}
                disabled={isProcessing} 
                className={`w-full text-left px-3 py-2 sm:py-2.5 rounded-md transition-colors duration-150 flex items-center group
                  ${currentProjectId === null && selectedFrameworkId === framework.id && !isProcessing
                    ? 'bg-sky-500 text-white shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-800 focus:bg-neutral-200/70 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-neutral-100 disabled:opacity-60 disabled:hover:bg-transparent'}
                `}
                aria-current={currentProjectId === null && selectedFrameworkId === framework.id && !isProcessing ? "page" : undefined}
              >
                <div className="flex-grow min-w-0"> 
                  <span className="font-medium text-sm block truncate" title={framework.name}>{framework.name}</span>
                  <p className={`text-xs ${currentProjectId === null && selectedFrameworkId === framework.id && !isProcessing ? 'text-sky-50' : 'text-neutral-500 group-hover:text-neutral-600'}`}>
                    {framework.description.substring(0, 60)}...
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-grow">
        <h2 className="text-xs sm:text-sm font-semibold text-neutral-500 mb-2 sm:mb-3 tracking-wide uppercase">
          Project History
        </h2>
        {isProcessing && projectHistory.length === 0 && !projectDeletingId && !isProcessingDelete && <p className="text-sm text-neutral-500 italic px-3 py-2">Loading projects...</p>}
        {!isProcessing && projectHistory.length === 0 && (
          <p className="text-sm text-neutral-500 italic px-3 py-2">No projects yet. Start a new story!</p>
        )}
        {projectHistory.length > 0 && (
          <ul className="space-y-1 sm:space-y-1.5">
            {projectHistory.map((project) => (
              <li key={project.id} className="relative group">
                <button
                  onClick={() => handleLoadProjectClick(project.id)}
                  disabled={isProcessing && (projectDeletingId === project.id && isProcessingDelete)} // Disable if this specific project is being deleted
                  className={`w-full text-left px-3 py-2 sm:py-2.5 rounded-md transition-colors duration-150 flex items-center
                    ${currentProjectId === project.id && !isProcessing
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-800 focus:bg-neutral-200/70 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-neutral-100 disabled:opacity-60 disabled:hover:bg-transparent'}
                    ${(projectDeletingId === project.id && isProcessingDelete) ? 'opacity-50 cursor-default' : ''}  
                  `}
                  aria-current={currentProjectId === project.id && !isProcessing ? "page" : undefined}
                >
                  <Icon name="ClockHistory" className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${currentProjectId === project.id && !isProcessing ? 'text-sky-100' : 'text-neutral-400 group-hover:text-sky-600'}`} />
                  <div className="flex-grow min-w-0"> 
                    <span className="font-medium text-sm truncate block" title={project.name}>
                      {project.name}
                    </span>
                    <p className={`text-xs ${currentProjectId === project.id && !isProcessing ? 'text-sky-50' : 'text-neutral-500 group-hover:text-neutral-600'}`}>
                      {new Date(project.lastmodified).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    if (!(isProcessingDelete && projectDeletingId === project.id)) onAttemptDeleteProject(project.id);
                  }}
                  disabled={isProcessingDelete && projectDeletingId === project.id} // Disable only if this project is being deleted
                  className={`absolute top-1/2 right-1 sm:right-1.5 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                            ${currentProjectId === project.id && !isProcessing ? 'text-sky-100 hover:text-white hover:bg-sky-600/80' : 'text-neutral-500 hover:text-red-500 hover:bg-red-400/10'}
                           rounded-md z-10`}
                  aria-label={`Delete project ${project.name}`}
                >
                  {(isProcessingDelete && projectDeletingId === project.id) ? <LoadingSpinner size="sm" /> : <Icon name="Trash" className="w-4 h-4" />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};