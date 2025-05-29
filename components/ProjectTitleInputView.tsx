
import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { MarkdownInput } from './MarkdownInput';

interface ProjectTitleInputViewProps {
  frameworkName: string;
  onSubmitTitle: (title: string) => void;
  onCancel: () => void;
}

export const ProjectTitleInputView: React.FC<ProjectTitleInputViewProps> = ({
  frameworkName,
  onSubmitTitle,
  onCancel,
}) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmitTitle(title.trim());
    } else {
      onSubmitTitle(`Untitled ${frameworkName} Story`);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-stone-50 text-neutral-800 selection:bg-sky-200 selection:text-sky-700 pb-20 md:pb-8">
      <div className="w-full max-w-md lg:max-w-lg bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-neutral-200/80 text-center">
        <Icon name="BookOpen" className="w-12 h-12 sm:w-16 sm:h-16 text-sky-500 mx-auto mb-4 sm:mb-6" />
        
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-700 mb-1 sm:mb-2">
          Let's Get Started
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 mb-0.5 sm:mb-1">
          You're using the <span className="font-medium text-sky-600">{frameworkName}</span> framework.
        </p>
        <p className="text-sm sm:text-base text-neutral-500 mb-4 sm:mb-6">
          Give your new project a title to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <MarkdownInput
            id="projectTitleInput"
            label="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g., My Awesome ${frameworkName} Adventure`}
            className="text-base sm:text-lg text-center"
            inputMode="text"
            rows={1}
            autoFocus
            style={{ backgroundColor: '#fdfdfd' }}
          />
          <div className="flex flex-col-reverse sm:flex-row-reverse gap-2 sm:gap-3 justify-center pt-1 sm:pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto text-sm sm:text-base"
              leftIcon={<Icon name="Check" className="w-4 h-4 sm:w-5 sm:h-5"/>}
            >
              Create Project
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
          </div>
        </form>
        <p className="text-xs text-neutral-400 mt-4 sm:mt-6">
          You can always change the project name later if needed.
        </p>
      </div>
    </div>
  );
};
