
import React, { useState, useEffect, FormEvent } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { supabase } from '../supabaseClient';
import { LoadingSpinner } from './LoadingSpinner';

interface OnboardingModalProps {
  userId: string;
  onFinishOnboarding: (profile: UserProfile) => void;
  onSkipOnboarding: (profile?: UserProfile) => void;
  initialProfileData?: UserProfile | null;
}

const PREDEFINED_GENRES = [
  "Science Fiction", "Fantasy", "Mystery", "Thriller", "Romance", 
  "Historical Fiction", "Horror", "Contemporary", "Young Adult", 
  "Children's Literature", "Comedy", "Drama", "Adventure", "Crime"
];

const STEPS = [
  { id: 'welcome', title: 'Welcome to StoryGenPro!' },
  { id: 'genres', title: 'Tell Us About Your Stories' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  userId,
  onFinishOnboarding,
  onSkipOnboarding,
  initialProfileData,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    display_name: '',
    preferred_genres: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfileData) {
      setFormData({
        display_name: initialProfileData.display_name || '',
        preferred_genres: initialProfileData.preferred_genres || [],
      });
    }
  }, [initialProfileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreChange = (genre: string) => {
    setFormData(prev => {
      const currentGenres = prev.preferred_genres || [];
      if (currentGenres.includes(genre)) {
        return { ...prev, preferred_genres: currentGenres.filter(g => g !== genre) };
      } else {
        return { ...prev, preferred_genres: [...currentGenres, genre] };
      }
    });
  };

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileToSave: UserProfile = {
        id: userId,
        display_name: formData.display_name?.trim() || null,
        preferred_genres: formData.preferred_genres && formData.preferred_genres.length > 0 ? formData.preferred_genres : null,
        onboarding_completed: true,
      };

      const { data, error: supabaseError } = await supabase
        .from('user_profiles')
        .upsert(profileToSave, { onConflict: 'id' })
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      onFinishOnboarding(data as UserProfile);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileToSave: UserProfile = {
        id: userId,
        display_name: initialProfileData?.display_name || formData.display_name?.trim() || null, // Save name if entered before skip
        preferred_genres: initialProfileData?.preferred_genres || (formData.preferred_genres && formData.preferred_genres.length > 0 ? formData.preferred_genres : null), // Save genres if selected before skip
        onboarding_completed: true,
      };
      const { data, error: supabaseError } = await supabase
        .from('user_profiles')
        .upsert(profileToSave, { onConflict: 'id' })
        .select()
        .single();
      
      if (supabaseError) throw supabaseError;
      onSkipOnboarding(data as UserProfile);

    } catch (err: any) {
      console.error("Error skipping onboarding:", err);
       setError(err.message || 'Failed to skip onboarding.');
       // Still call onSkipOnboarding without profile data if db fails, to unblock user
       if (!err.message.includes('Failed to fetch')) { // Avoid infinite loop if fetch itself is the problem
           onSkipOnboarding();
       }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStepIndex].id) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <p className="text-base sm:text-lg text-neutral-600">
              Let's personalize your experience! First, how should we greet you?
            </p>
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Your Name (or Pen Name)
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name || ''}
                onChange={handleInputChange}
                placeholder="e.g., Alex Storyweaver"
                className="w-full p-3 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-neutral-800 placeholder:text-neutral-400 text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>
          </div>
        );
      case 'genres':
        return (
          <div className="space-y-4">
            <p className="text-base sm:text-lg text-neutral-600">
              What kind of stories do you love to create or read? Select your favorite genres.
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 rounded-md border border-neutral-200 p-3 bg-neutral-50">
              {PREDEFINED_GENRES.map(genre => (
                <label key={genre} className="flex items-center space-x-3 p-2 rounded-md hover:bg-neutral-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={(formData.preferred_genres || []).includes(genre)}
                    onChange={() => handleGenreChange(genre)}
                    className="h-4 w-4 rounded bg-white border-neutral-400 text-sky-600 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-neutral-50"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-neutral-700">{genre}</span>
                </label>
              ))}
            </div>
             <p className="text-xs text-neutral-500">You can select multiple genres. This helps us tailor suggestions later on.</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  if (isLoading && !error) { // Show full screen loader only if initial loading or saving without prior error
    return (
      <div className="fixed inset-0 bg-stone-100 flex flex-col items-center justify-center z-[200]">
        <LoadingSpinner size="lg" text="Setting up your profile..." />
      </div>
    );
  }


  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-100 via-neutral-100 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 z-[200]">
      <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-neutral-200/80">
        <header className="text-center mb-6 sm:mb-8">
          <Icon name="Sparkles" className="w-12 h-12 sm:w-14 sm:h-14 text-sky-500 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-800">
            {STEPS[currentStepIndex].title}
          </h1>
        </header>

        <div className="min-h-[200px] sm:min-h-[250px] mb-6 sm:mb-8">
          {renderStepContent()}
        </div>

        {error && (
          <p className="my-3 text-xs text-red-600 bg-red-50 p-2 rounded-md text-center">{error}</p>
        )}

        <div className="flex flex-col space-y-3">
          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <Button variant="secondary" onClick={prevStep} disabled={isLoading} className="flex-1">
                Previous
              </Button>
            )}
            {currentStepIndex < STEPS.length - 1 ? (
              <Button variant="primary" onClick={nextStep} disabled={isLoading} className="flex-1">
                Next
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSave} isLoading={isLoading} disabled={isLoading} className="flex-1">
                Save & Finish
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={handleSkip} disabled={isLoading} className="w-full text-neutral-500 hover:text-neutral-700">
            Skip for Now
          </Button>
        </div>
         <div className="mt-4 text-center text-xs text-neutral-400">
            Step {currentStepIndex + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  );
};
