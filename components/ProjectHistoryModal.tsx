
import React, { useState } from 'react';
import { ProjectVersion } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';

interface ProjectHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ProjectVersion[];
  onRevert: (version: ProjectVersion) => Promise<void>;
  isLoadingVersions: boolean;
  isRevertingVersionId: string | null; 
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  onRevert,
  isLoadingVersions,
  isRevertingVersionId,
}) => {
  const [confirmRevertVersion, setConfirmRevertVersion] = useState<ProjectVersion | null>(null);

  if (!isOpen) return null;

  const handleRevertClick = (version: ProjectVersion) => {
    setConfirmRevertVersion(version);
  };

  const handleConfirmRevert = async () => {
    if (confirmRevertVersion) {
      await onRevert(confirmRevertVersion);
      setConfirmRevertVersion(null); 
      // Optionally close modal after revert, or let App.tsx handle it based on success
      // onClose(); 
    }
  };

  const handleCancelRevert = () => {
    setConfirmRevertVersion(null);
  };

  const renderConfirmRevertDialog = () => {
    if (!confirmRevertVersion) return null;
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-10 rounded-lg">
        <div className="bg-white p-6 rounded-lg shadow-xl border border-neutral-300 text-center">
          <Icon name="ExclamationTriangle" className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">Revert Project?</h3>
          <p className="text-sm text-neutral-600 mb-1">
            Revert to version: <strong className="block">"{confirmRevertVersion.version_name}"</strong>
          </p>
          <p className="text-xs text-neutral-500 mb-4">
            (Saved on: {new Date(confirmRevertVersion.created_at).toLocaleString()})
          </p>
          <p className="text-sm text-neutral-600 mb-4">
            This will create a new version reflecting this reverted state.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={handleCancelRevert} disabled={!!isRevertingVersionId} size="sm">
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleConfirmRevert} 
              isLoading={isRevertingVersionId === confirmRevertVersion.id}
              disabled={!!isRevertingVersionId && isRevertingVersionId !== confirmRevertVersion.id}
              size="sm"
            >
              Confirm Revert
            </Button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[150]" // Higher z-index than AI modal
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-history-modal-title"
    >
      <div
        className="bg-neutral-50 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg md:max-w-2xl max-h-[85vh] flex flex-col border border-neutral-300 text-neutral-800 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 border-b border-neutral-200">
          <h2 id="project-history-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-700 flex items-center">
            <Icon name="ClockArrowRotateLeft" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-sky-600" />
            Project Version History
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal" className="!p-1.5 sm:!p-2 text-neutral-500 hover:text-neutral-700">
            <Icon name="XMark" className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-grow pr-1 sm:pr-2">
          {isLoadingVersions && (
            <div className="py-10 text-center">
              <LoadingSpinner text="Loading project history..." />
            </div>
          )}
          {!isLoadingVersions && versions.length === 0 && (
            <p className="text-neutral-500 italic text-center py-10">No history recorded for this project yet.</p>
          )}
          {!isLoadingVersions && versions.length > 0 && (
            <ul className="space-y-2 sm:space-y-3">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="bg-white p-3 rounded-md border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-neutral-700">{version.version_name}</p>
                    <p className="text-xs text-neutral-500">
                      Saved: {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="accent-ghost"
                    size="sm"
                    onClick={() => handleRevertClick(version)}
                    disabled={!!isRevertingVersionId || !!confirmRevertVersion} 
                    isLoading={isRevertingVersionId === version.id && !confirmRevertVersion} // Show spinner only if actively reverting THIS version AND confirm dialog is not up
                    className="!text-xs whitespace-nowrap self-start sm:self-center"
                  >
                    {isRevertingVersionId === version.id && !confirmRevertVersion ? 'Reverting...' : 'Revert to this version'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
         {renderConfirmRevertDialog()}
      </div>
    </div>
  );
};
