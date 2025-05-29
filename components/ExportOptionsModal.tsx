
import React, { useEffect } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { ExportOptions } from '../services/exportService';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ExportOptions;
  onPreferencesChange: (newPreferences: ExportOptions) => void;
  onConfirmExport: (format: 'pdf' | 'docx') => void;
  isExporting: boolean;
  exportError: string | null;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onPreferencesChange,
  onConfirmExport,
  isExporting,
  exportError,
}) => {
  if (!isOpen) return null;

  // Effect to manage the disabling of includeContinuousNarrative
  useEffect(() => {
    if (preferences.includeStageTitles && preferences.includeContinuousNarrative) {
      onPreferencesChange({
        ...preferences,
        includeContinuousNarrative: false, // Uncheck and disable if StageTitles is checked
      });
    }
  }, [preferences.includeStageTitles, preferences.includeContinuousNarrative, onPreferencesChange]);


  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    let newPreferences = { ...preferences, [name]: checked };

    // If 'includeStageTitles' is checked, 'includeContinuousNarrative' must be false.
    if (name === 'includeStageTitles' && checked) {
        newPreferences.includeContinuousNarrative = false;
    }
    
    onPreferencesChange(newPreferences);
  };


  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-options-modal-title"
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-xl w-full max-w-lg flex flex-col border border-neutral-200 text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-5">
          <h2 id="export-options-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-700 flex items-center">
            <Icon name="DocumentArrowDown" className="w-6 h-6 mr-2 text-sky-600" />
            Export Story Options
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal" className="!p-1.5 sm:!p-2 text-neutral-500 hover:text-neutral-700">
            <Icon name="XMark" className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6 overflow-y-auto max-h-[60vh] pr-1">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-neutral-600 mb-1">Elements to Include:</legend>
            <div>
              <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  name="includeFrameworkTitle"
                  checked={preferences.includeFrameworkTitle}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded bg-neutral-100 border-neutral-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-white"
                  disabled={isExporting}
                />
                <span className="text-sm text-neutral-700">Framework Title & Description</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  name="includeOriginalIdea"
                  checked={preferences.includeOriginalIdea}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded bg-neutral-100 border-neutral-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-white"
                  disabled={isExporting}
                />
                <span className="text-sm text-neutral-700">Original Story Idea</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  name="includeStageTitles"
                  checked={preferences.includeStageTitles}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded bg-neutral-100 border-neutral-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-white"
                  disabled={isExporting}
                />
                <span className="text-sm text-neutral-700">Stage Titles & Descriptions (Segmented Output)</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  name="includeContinuousNarrative"
                  checked={preferences.includeContinuousNarrative}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded bg-neutral-100 border-neutral-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-white"
                  disabled={isExporting || preferences.includeStageTitles} // Disabled if exporting or if StageTitles is checked
                />
                <span className={`text-sm text-neutral-700 ${preferences.includeStageTitles ? 'text-neutral-400' : ''}`}>
                  Continuous Narrative (Combined story flow, appended)
                </span>
              </label>
              {preferences.includeStageTitles && (
                <p className="text-xs text-sky-600 bg-sky-50 p-1.5 rounded-md ml-6 mt-1">
                  "Continuous Narrative" is disabled because "Stage Titles & Descriptions" is selected, which provides a structured, titled flow.
                </p>
              )}
               {preferences.includeContinuousNarrative && !preferences.includeStageTitles && (
                 <p className="text-xs text-sky-600 bg-sky-50 p-1.5 rounded-md ml-6 mt-1">
                    A section with all story content combined into a single narrative will be added to your export.
                </p>
            )}
            </div>
          </fieldset>

          {/* Document Structure radio group removed */}
        </div>
         {exportError && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-300 text-red-700 rounded-md text-xs sm:text-sm" role="alert">
              <p className="font-semibold">Export Error:</p>
              <p>{exportError}</p>
            </div>
          )}

        <div className="mt-2 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isExporting} className="order-3 sm:order-1 text-sm sm:text-base">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirmExport('pdf')}
            isLoading={isExporting}
            disabled={isExporting}
            className="order-1 sm:order-2 text-sm sm:text-base"
            leftIcon={<Icon name="DocumentArrowDown" className="w-4 h-4"/>}
          >
            Export PDF
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirmExport('docx')}
            isLoading={isExporting}
            disabled={isExporting}
            className="order-2 sm:order-3 text-sm sm:text-base"
            leftIcon={<Icon name="DocumentArrowDown" className="w-4 h-4"/>}
          >
            Export DOCX
          </Button>
        </div>
      </div>
    </div>
  );
};