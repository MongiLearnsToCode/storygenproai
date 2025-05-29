
import React from 'react';
import { StoryFramework, Project } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { STORY_FRAMEWORKS } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewType: 'frameworks' | 'projects';
  projectHistory: Project[];
  selectedFrameworkId: string | null;
  currentProjectId: string | null;
  onSelectFramework: (frameworkId: string) => void;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  isProcessing: boolean; // General loading state from App
  projectDeletingId: string | null; // ID of project for which delete modal is open or is being deleted
  isProcessingDelete: boolean; // True if a delete DB operation is in progress
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  isOpen,
  onClose,
  viewType,
  projectHistory,
  selectedFrameworkId,
  currentProjectId,
  onSelectFramework,
  onLoadProject,
  onDeleteProject,
  isProcessing,
  projectDeletingId,
  isProcessingDelete,
}) => {
  if (!isOpen) return null;

  const title = viewType === 'frameworks' ? 'Select a Framework' : 'Project History';
  const iconName = viewType === 'frameworks' ? 'Grid' : 'ClockHistory';

  const handleFrameworkSelect = (frameworkId: string) => {
    if (isProcessing) return;
    onSelectFramework(frameworkId);
  };

  const handleProjectLoad = (projectId: string) => {
     if (isProcessing && (projectDeletingId === projectId && isProcessingDelete)) return; 
     if (isProcessing && projectDeletingId && projectDeletingId !== projectId) return; 
     if (isProcessing && !projectDeletingId) return; 
    onLoadProject(projectId);
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!(isProcessingDelete && projectDeletingId === projectId)) {
      onDeleteProject(projectId);
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col z-[60] md:hidden"
      onClick={onClose} 
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      <div 
        className="bg-neutral-100 text-neutral-800 flex-1 flex flex-col max-h-full mt-10 rounded-t-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()} 
      >
        <header className="p-4 border-b border-neutral-300 flex items-center justify-between sticky top-0 bg-neutral-100 z-10 rounded-t-2xl">
          <div className="flex items-center">
            <Icon name={iconName} className="w-6 h-6 text-sky-600 mr-3" />
            <h2 id="mobile-menu-title" className="text-lg font-semibold text-neutral-700">{title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close menu" className="!p-2">
            <Icon name="XMark" className="w-5 h-5" />
          </Button>
        </header>

        <div className="overflow-y-auto flex-grow p-3 space-y-2">
          {viewType === 'frameworks' && (
            <ul className="space-y-1.5">
              {STORY_FRAMEWORKS.map((framework) => (
                <li key={framework.id}>
                  <button
                    onClick={() => handleFrameworkSelect(framework.id)}
                    disabled={isProcessing}
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex flex-col group
                      ${currentProjectId === null && selectedFrameworkId === framework.id && !isProcessing
                        ? 'bg-sky-500 text-white shadow-md' 
                        : 'bg-white hover:bg-neutral-200/70 text-neutral-700 focus:bg-neutral-200/70 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-neutral-100 disabled:opacity-70 disabled:hover:bg-white border border-neutral-200 hover:border-neutral-300'}
                    `}
                    aria-current={currentProjectId === null && selectedFrameworkId === framework.id && !isProcessing ? "page" : undefined}
                  >
                    <span className="font-semibold text-sm block truncate" title={framework.name}>{framework.name}</span>
                    <p className={`text-xs mt-0.5 ${currentProjectId === null && selectedFrameworkId === framework.id && !isProcessing ? 'text-sky-100' : 'text-neutral-500 group-hover:text-neutral-600'}`}>
                      {framework.description}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {viewType === 'projects' && (
            <>
              {isProcessing && projectHistory.length === 0 && !projectDeletingId && !isProcessingDelete && <p className="text-sm text-neutral-500 italic p-3 text-center">Loading projects...</p>}
              {!isProcessing && projectHistory.length === 0 && (
                <p className="text-sm text-neutral-500 italic p-3 text-center">No projects yet.</p>
              )}
              {projectHistory.length > 0 && (
                <ul className="space-y-1.5">
                  {projectHistory.map((project) => (
                    <li key={project.id} className="relative group">
                      <button
                        onClick={() => handleProjectLoad(project.id)}
                        disabled={isProcessing && (projectDeletingId === project.id && isProcessingDelete)}
                        className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center
                          ${currentProjectId === project.id && !isProcessing
                            ? 'bg-sky-500 text-white shadow-md' 
                            : 'bg-white hover:bg-neutral-200/70 text-neutral-700 focus:bg-neutral-200/70 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-neutral-100 disabled:opacity-70 disabled:hover:bg-white border border-neutral-200 hover:border-neutral-300'}
                          ${(projectDeletingId === project.id && isProcessingDelete) ? 'opacity-50 cursor-default' : ''}  
                        `}
                        aria-current={currentProjectId === project.id && !isProcessing ? "page" : undefined}
                      >
                        <Icon name="ClockHistory" className={`w-5 h-5 mr-3 ${currentProjectId === project.id && !isProcessing ? 'text-sky-100' : 'text-neutral-400 group-hover:text-sky-600'}`} />
                        <div className="flex-grow min-w-0"> 
                          <span className="font-semibold text-sm truncate block" title={project.name}>
                            {project.name}
                          </span>
                          <p className={`text-xs mt-0.5 ${currentProjectId === project.id && !isProcessing ? 'text-sky-100' : 'text-neutral-500 group-hover:text-neutral-600'}`}>
                            {new Date(project.lastmodified).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, project.id)}
                        disabled={isProcessingDelete && projectDeletingId === project.id}
                        className={`absolute top-1/2 right-2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
