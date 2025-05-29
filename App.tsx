

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StoryEditor } from './components/StoryEditor';
import { STORY_FRAMEWORKS, MAX_PROJECT_VERSIONS } from './constants';
import { StoryFramework, Project, ToastMessage, SubscriptionTier, AIUsageState, AI_LIMITS, ProjectVersion, UserProfile } from './types';
import { IdeaEntryView } from './components/IdeaEntryView';
import { mapIdeaToFramework } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProjectTitleInputView } from './components/ProjectTitleInputView';
import { BottomNavBar } from './components/BottomNavBar';
import { MobileMenuModal } from './components/MobileMenuModal';
import { ToastNotifications } from './components/ToastNotifications';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { UpgradeModal } from './components/UpgradeModal';
import { OnboardingModal } from './components/OnboardingModal'; // Added
import { supabase } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { Auth } from './components/Auth'; // Added import for Auth component

interface PendingProjectData {
  frameworkId: string;
  stagesContent: Record<string, string>;
  rawStoryIdea?: string;
}

type MobileMenuView = 'frameworks' | 'projects';
type ActiveBottomNavTab = 'frameworks' | 'projects' | 'new';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // User Profile and Onboarding State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

  const [rawStoryIdea, setRawStoryIdea] = useState<string>('');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectHistory, setProjectHistory] = useState<Project[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState<boolean>(false);
  const [isLoadingMapping, setIsLoadingMapping] = useState<boolean>(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  const [isAwaitingProjectTitle, setIsAwaitingProjectTitle] = useState<boolean>(false);
  const [pendingProjectData, setPendingProjectData] = useState<PendingProjectData | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [mobileMenuView, setMobileMenuView] = useState<MobileMenuView | null>(null);
  const [activeBottomNavTab, setActiveBottomNavTab] = useState<ActiveBottomNavTab>('new');

  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [isGeneratingAllStages, setIsGeneratingAllStages] = useState<boolean>(false);

  // Subscription and Usage State
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [aiUsage, setAIUsage] = useState<AIUsageState>({
    singleStageGenerations: 0,
    clarifyingQuestions: 0,
    fullStoryDrafters: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalSource, setUpgradeModalSource] = useState<string>('feature_limit');

  // Project Version History State
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [isProjectHistoryModalOpen, setIsProjectHistoryModalOpen] = useState<boolean>(false);
  const [isLoadingProjectVersions, setIsLoadingProjectVersions] = useState<boolean>(false);
  const [isRevertingVersionId, setIsRevertingVersionId] = useState<string | null>(null);


  const API_KEY = process.env.API_KEY; 

  const fetchUserProfile = useCallback(async (userId: string) => {
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
        if (!data.onboarding_completed) {
          setShowOnboardingModal(true);
        } else {
          setShowOnboardingModal(false); // Ensure it's closed if already completed
        }
      } else { // No profile found, implies new user or profile creation failed previously
        setUserProfile(null);
        setShowOnboardingModal(true); // Trigger onboarding for new users
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setToastMessage({ id: 'profile-fetch-err', message: `Failed to load user profile: ${err.message}`, type: 'error' });
      setUserProfile(null); // Ensure profile is null on error
      // Potentially allow app to continue without profile, or show a specific error state
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);
  
  useEffect(() => {
    setIsLoadingAuth(true);
    setIsLoadingProfile(true); // Assume we'll load profile if session exists

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const user = currentSession?.user ?? null;
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (user) {
        await fetchUserProfile(user.id);
      } else {
        setIsLoadingProfile(false); // No user, no profile to load
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const user = newSession?.user ?? null;
      setCurrentUser(user);

      if (_event === 'SIGNED_IN' && user) {
        await fetchUserProfile(user.id);
      } else if (_event === 'SIGNED_OUT') {
        setUserProfile(null);
        setShowOnboardingModal(false);
        setIsLoadingProfile(false);
        setCurrentProject(null);
        setProjectHistory([]);
        setSelectedFrameworkId(null);
        setRawStoryIdea('');
        setActiveBottomNavTab('new');
        setToastMessage(null);
        setIsConfirmDeleteModalOpen(false);
        setProjectToDelete(null);
        setIsGeneratingAllStages(false);
        setUserSubscriptionTier(SubscriptionTier.FREE); 
        resetAIUsage();
        setProjectVersions([]);
        setIsProjectHistoryModalOpen(false);
      } else if (!user) {
        // If session becomes null for reasons other than explicit SIGNED_OUT
        setUserProfile(null);
        setShowOnboardingModal(false);
        setIsLoadingProfile(false);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);


  useEffect(() => {
    if (session?.user) {
      // Future: fetch profile/sub/usage from DB more detailedly. For now, tier is static.
    } else {
      setUserSubscriptionTier(SubscriptionTier.FREE);
      resetAIUsage();
      setProjectVersions([]); // Clear versions on logout
    }
  }, [session]);


  const resetAIUsage = () => {
    setAIUsage({
      singleStageGenerations: 0,
      clarifyingQuestions: 0,
      fullStoryDrafters: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    });
  };

  const checkAndIncrementAIUsage = useCallback((
    type: 'singleStageGenerations' | 'clarifyingQuestions' | 'fullStoryDrafters'
  ): boolean => {
    const today = new Date().toISOString().split('T')[0];
    let currentUsage = { ...aiUsage };

    if (currentUsage.lastResetDate !== today) {
      currentUsage = {
        singleStageGenerations: 0,
        clarifyingQuestions: 0,
        fullStoryDrafters: 0,
        lastResetDate: today,
      };
    }

    const limits = AI_LIMITS[userSubscriptionTier];
    
    if (currentUsage[type] < limits[type]) {
      currentUsage[type]++;
      setAIUsage(currentUsage);
      return true;
    } else {
      handleOpenUpgradeModal(`ai_limit_${type.toLowerCase().replace(/\s+/g, '_')}`);
      return false;
    }
  }, [aiUsage, userSubscriptionTier]);


  const fetchProjectHistory = useCallback(async (userId: string) => {
    if (!userId) return;
    setIsLoadingData(true);
    setMappingError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select('*') 
        .eq('user_id', userId)
        .order('lastmodified', { ascending: false }); 

      if (supabaseError) throw supabaseError; 
      setProjectHistory((data as Project[]) || []); 
    } catch (err: any) {
      console.error("Original error object during fetchProjectHistory:", err);
      let userFriendlyMessage = "Could not load your projects.";
      let errorDetailsMessage = "An unexpected error occurred."; 
      if (err && typeof err.message === 'string' && err.message.trim() !== "") {
        errorDetailsMessage = err.message.trim();
      } else if (err && typeof err.toString === 'function' && err.toString().trim() !== "" && err.toString() !== "[object Object]") {
        errorDetailsMessage = err.toString().trim();
      }
      let additionalInfo = "";
      if (err && typeof err.details === 'string' && err.details.trim() !== "" && err.details.trim().toLowerCase() !== errorDetailsMessage.toLowerCase()) {
        additionalInfo += ` Details: ${err.details.trim()}.`;
      }
      if (err && typeof err.hint === 'string' && err.hint.trim() !== "") {
        additionalInfo += ` Hint: ${err.hint.trim()}.`;
      }
      const fullDisplayMessage = `${userFriendlyMessage} ${errorDetailsMessage}${additionalInfo}`;
      setMappingError(fullDisplayMessage);
      setProjectHistory([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user && (userProfile?.onboarding_completed || !showOnboardingModal)) { // Fetch projects only if onboarding is done or not shown
      fetchProjectHistory(session.user.id);
    } else if (!session?.user) {
      setProjectHistory([]);
      setCurrentProject(null);
      setProjectVersions([]);
    }
  }, [session, fetchProjectHistory, userProfile, showOnboardingModal]);


  const saveProjectVersion = useCallback(async (projectData: Project, versionName: string) => {
    if (!projectData.user_id || !projectData.id) {
      console.error("Cannot save version: Missing user_id or project_id.", projectData);
      return;
    }
    try {
      const versionToSave = {
        project_id: projectData.id,
        user_id: projectData.user_id,
        stagescontent: projectData.stagescontent,
        rawstoryidea: projectData.rawstoryidea,
        version_name: versionName,
      };
      const { error: insertError } = await supabase.from('project_versions').insert(versionToSave);
      if (insertError) throw insertError;

      const { data: versions, error: fetchError } = await supabase
        .from('project_versions')
        .select('id, created_at')
        .eq('project_id', projectData.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (versions && versions.length > MAX_PROJECT_VERSIONS) {
        const versionsToDelete = versions.slice(MAX_PROJECT_VERSIONS).map(v => v.id);
        if (versionsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('project_versions')
            .delete()
            .in('id', versionsToDelete);
          if (deleteError) console.error("Error trimming old project versions:", deleteError);
        }
      }
      if (isProjectHistoryModalOpen || (currentProject && currentProject.id === projectData.id) ) {
          await fetchProjectVersions(projectData.id);
      }

    } catch (error) {
      console.error("Error saving project version:", error);
      setToastMessage({ id: 'version-save-err', message: `Failed to save project version: ${(error as Error).message}`, type: 'error' });
    }
  }, [isProjectHistoryModalOpen, currentProject]);

  const fetchProjectVersions = useCallback(async (projectId: string) => {
    if (!projectId || !session?.user) {
      setProjectVersions([]);
      return;
    }
    setIsLoadingProjectVersions(true);
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_PROJECT_VERSIONS); 

      if (error) throw error;
      setProjectVersions((data as ProjectVersion[]) || []);
    } catch (error) {
      console.error("Error fetching project versions:", error);
      setProjectVersions([]);
      setToastMessage({ id: 'versions-fetch-err', message: `Failed to load project versions: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoadingProjectVersions(false);
    }
  }, [session]);

  const handleRevertToVersion = useCallback(async (versionToRevertTo: ProjectVersion) => {
    if (!currentProject || !session?.user) {
      setToastMessage({ id: 'revert-err-auth', message: 'Cannot revert: No active project or user session.', type: 'error' });
      return;
    }
    setIsRevertingVersionId(versionToRevertTo.id);
    try {
      const revertedProjectData: Project = {
        ...currentProject,
        stagescontent: versionToRevertTo.stagescontent,
        rawstoryidea: versionToRevertTo.rawstoryidea,
        lastmodified: new Date().toISOString(), 
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          stagescontent: revertedProjectData.stagescontent,
          rawstoryidea: revertedProjectData.rawstoryidea,
          lastmodified: revertedProjectData.lastmodified,
        })
        .eq('id', currentProject.id)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      setCurrentProject(revertedProjectData);
      setProjectHistory(prev =>
        prev.map(p => p.id === revertedProjectData.id ? revertedProjectData : p)
          .sort((a, b) => new Date(b.lastmodified).getTime() - new Date(a.lastmodified).getTime())
      );
      
      const versionName = `Reverted to version from ${new Date(versionToRevertTo.created_at).toLocaleString()}`;
      await saveProjectVersion(revertedProjectData, versionName);
      
      setToastMessage({ id: 'revert-succ', message: `Project reverted to version: "${versionToRevertTo.version_name}".`, type: 'success' });
      await fetchProjectVersions(currentProject.id); 
    } catch (error) {
      console.error("Error reverting project version:", error);
      setToastMessage({ id: 'revert-err-save', message: `Failed to revert project: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsRevertingVersionId(null);
    }
  }, [currentProject, session, saveProjectVersion, fetchProjectVersions]);


  useEffect(() => {
    if (session?.user && projectHistory.length > 0 && !currentProject && !isLoadingData && !isAwaitingProjectTitle && !isLoadingMapping && !projectToDelete && !isGeneratingAllStages && !isRevertingVersionId && (userProfile?.onboarding_completed || !showOnboardingModal)) {
      const lastActiveProjectId = localStorage.getItem(`lastActiveProjectId_${session.user.id}`);
      if (lastActiveProjectId) {
        const projectToLoad = projectHistory.find(p => p.id === lastActiveProjectId);
        if (projectToLoad) {
          setCurrentProject(projectToLoad);
          setSelectedFrameworkId(projectToLoad.frameworkid);
          setRawStoryIdea(projectToLoad.rawstoryidea || ''); 
          setActiveBottomNavTab('projects');
          fetchProjectVersions(projectToLoad.id); 
        } else {
           localStorage.removeItem(`lastActiveProjectId_${session.user.id}`);
        }
      }
    }
  }, [projectHistory, session, isLoadingData, currentProject, isAwaitingProjectTitle, isLoadingMapping, projectToDelete, isGeneratingAllStages, fetchProjectVersions, isRevertingVersionId, userProfile, showOnboardingModal]);


  useEffect(() => {
    if (currentProject && session?.user) {
      localStorage.setItem(`lastActiveProjectId_${session.user.id}`, currentProject.id);
    } else if (!currentProject && session?.user) {
      const wasActive = localStorage.getItem(`lastActiveProjectId_${session.user.id}`);
      if (wasActive) localStorage.removeItem(`lastActiveProjectId_${session.user.id}`);
    }
  }, [currentProject, session]);
  
  useEffect(() => {
    if (!currentProject && !isAwaitingProjectTitle && !isLoadingMapping && !isGeneratingAllStages && !isRevertingVersionId) {
        localStorage.setItem('storyGenProRawIdea', rawStoryIdea);
    }
  }, [rawStoryIdea, currentProject, isAwaitingProjectTitle, isLoadingMapping, isGeneratingAllStages, isRevertingVersionId]);

   useEffect(() => {
    if (!session && !currentProject) { 
        const savedRawIdea = localStorage.getItem('storyGenProRawIdea');
        if (savedRawIdea) {
            setRawStoryIdea(savedRawIdea);
        }
    }
  }, [session, currentProject]);

  const openMobileMenu = useCallback((view: MobileMenuView) => {
    setMobileMenuView(view);
    setIsMobileMenuOpen(true);
    if (view === 'frameworks') setActiveBottomNavTab('frameworks');
    if (view === 'projects') setActiveBottomNavTab('projects');
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    if (currentProject) setActiveBottomNavTab('projects');
    else if (isAwaitingProjectTitle || (selectedFrameworkId && !currentProject)) setActiveBottomNavTab('frameworks');
    else setActiveBottomNavTab('new');
  }, [currentProject, selectedFrameworkId, isAwaitingProjectTitle]);

  const handleStartNewStory = useCallback(() => {
    if (userSubscriptionTier === SubscriptionTier.FREE && projectHistory.length >= AI_LIMITS[SubscriptionTier.FREE].projects && !(userProfile && !userProfile.onboarding_completed && showOnboardingModal) ) { // Don't block if onboarding is due
      handleOpenUpgradeModal('project_limit');
      return;
    }
    setToastMessage(null);
    setCurrentProject(null);
    setSelectedFrameworkId(null);
    setRawStoryIdea(''); 
    setMappingError(null);
    setIsLoadingMapping(false);
    setIsAwaitingProjectTitle(false);
    setPendingProjectData(null);
    setIsConfirmDeleteModalOpen(false);
    setProjectToDelete(null);
    setIsGeneratingAllStages(false);
    setProjectVersions([]); 
    setIsProjectHistoryModalOpen(false);
    setIsRevertingVersionId(null);
    if(session?.user) localStorage.removeItem(`lastActiveProjectId_${session.user.id}`);
    localStorage.removeItem('storyGenProRawIdea');
    setActiveBottomNavTab('new');
    closeMobileMenu();
  }, [closeMobileMenu, session, userSubscriptionTier, projectHistory.length, userProfile, showOnboardingModal]);

  const handleSelectFramework = useCallback(async (frameworkId: string) => {
    if (!session?.user) {
      setToastMessage({id: 'framework-login-err', message: "Please log in to create a new story project.", type: 'error', duration: 4000});
      return;
    }
    if (userSubscriptionTier === SubscriptionTier.FREE && projectHistory.length >= AI_LIMITS[SubscriptionTier.FREE].projects && !(userProfile && !userProfile.onboarding_completed && showOnboardingModal)) {
      handleOpenUpgradeModal('project_limit');
      return;
    }
    if (isProcessingDelete || projectToDelete || isGeneratingAllStages || isRevertingVersionId) return;

    setMappingError(null);
    const targetFramework = STORY_FRAMEWORKS.find(f => f.id === frameworkId);
    if (!targetFramework) return;

    setIsLoadingMapping(true);
    closeMobileMenu();
    setActiveBottomNavTab('frameworks');
    let newStagesContent: Record<string, string> = {};
    
    try {
      if (rawStoryIdea.trim() && API_KEY) {
        newStagesContent = await mapIdeaToFramework(rawStoryIdea, targetFramework);
      } else {
        targetFramework.stages.forEach(stage => newStagesContent[stage.id] = '');
      }

      setPendingProjectData({
        frameworkId: targetFramework.id, 
        stagesContent: newStagesContent, 
        rawStoryIdea: rawStoryIdea.trim() ? rawStoryIdea : undefined, 
      });
      setSelectedFrameworkId(targetFramework.id);
      setIsAwaitingProjectTitle(true);
    } catch (err: any) {
      const displayError = `An error occurred during idea processing: ${err.message || err.error_description || 'Unknown error'}.`;
      console.error("Failed to map idea:", err);
      setMappingError(displayError);
      setPendingProjectData(null);
      setIsAwaitingProjectTitle(false);
      setSelectedFrameworkId(null);
      setActiveBottomNavTab('new');
    } finally {
      setIsLoadingMapping(false);
    }
  }, [rawStoryIdea, API_KEY, closeMobileMenu, session, isProcessingDelete, projectToDelete, isGeneratingAllStages, userSubscriptionTier, projectHistory.length, isRevertingVersionId, userProfile, showOnboardingModal]);

  const handleProjectTitleSubmit = useCallback(async (title: string) => {
    if (!pendingProjectData || !selectedFrameworkId || !session?.user) {
      setMappingError("Could not create project. User session or pending data was missing.");
      setIsAwaitingProjectTitle(false);
      setPendingProjectData(null);
      setSelectedFrameworkId(null);
      setActiveBottomNavTab('new');
      return;
    }
    
    setIsLoadingData(true);
    setMappingError(null);
    const projectToSave = {
      user_id: session.user.id,
      name: title.trim() || `Untitled Story (${new Date().toLocaleDateString()})`,
      frameworkid: pendingProjectData.frameworkId,
      stagescontent: pendingProjectData.stagesContent, 
      rawstoryidea: pendingProjectData.rawStoryIdea, 
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectToSave) 
        .select()
        .single(); 

      if (error) throw error;
      
      const newProject = data as Project; 
      setProjectHistory(prev => [newProject, ...prev.filter(p => p.id !== newProject.id)]
                                .sort((a,b) => new Date(b.lastmodified).getTime() - new Date(a.lastmodified).getTime()));
      
      setCurrentProject(newProject); 
      await saveProjectVersion(newProject, "Project Created"); 
      setProjectVersions([]); 
      fetchProjectVersions(newProject.id);

      setIsAwaitingProjectTitle(false);
      setPendingProjectData(null);
      setRawStoryIdea(''); 
      localStorage.removeItem('storyGenProRawIdea');
      setActiveBottomNavTab('projects');
    } catch (err: any) {
      const displayMessage = `Failed to save project: ${err.message || err.error_description || 'Unknown error'}.`;
      console.error("Error saving project to Supabase:", displayMessage, "Original error:", err);
      setMappingError(displayMessage);
    } finally {
      setIsLoadingData(false);
    }
  }, [pendingProjectData, selectedFrameworkId, session, saveProjectVersion, fetchProjectVersions]);

  const handleCancelTitleInput = useCallback(() => {
    setIsAwaitingProjectTitle(false);
    setPendingProjectData(null);
    setSelectedFrameworkId(null); 
    setActiveBottomNavTab('new');
  }, []);

  const handleLoadProject = useCallback((projectId: string) => {
    if ((isProcessingDelete && projectToDelete?.id === projectId) || isGeneratingAllStages || isRevertingVersionId) return;

    const projectToLoad = projectHistory.find(p => p.id === projectId);
    if (projectToLoad) {
      setCurrentProject(projectToLoad);
      setSelectedFrameworkId(projectToLoad.frameworkid);
      setRawStoryIdea(projectToLoad.rawstoryidea || ''); 
      setMappingError(null); 
      setIsAwaitingProjectTitle(false);
      setPendingProjectData(null);
      setIsConfirmDeleteModalOpen(false); 
      setProjectToDelete(null);
      setActiveBottomNavTab('projects');
      fetchProjectVersions(projectToLoad.id); 
      closeMobileMenu();
    }
  }, [projectHistory, closeMobileMenu, isProcessingDelete, projectToDelete, isGeneratingAllStages, fetchProjectVersions, isRevertingVersionId]);

  const handleUpdateStageContent = useCallback(async (stageId: string, content: string, stageName: string) => {
    if (!currentProject || !session?.user || isGeneratingAllStages || isRevertingVersionId) return;
    setMappingError(null);
    const updatedStagesContent = { 
      ...currentProject.stagescontent, 
      [stageId]: content,
    };
    const newLastModified = new Date().toISOString();

    const oldProject = currentProject;
    const optimisticallyUpdatedProject: Project = { 
      ...currentProject,
      stagescontent: updatedStagesContent, 
      lastmodified: newLastModified, 
    };
    setCurrentProject(optimisticallyUpdatedProject);
    setProjectHistory(prevHistory => 
      prevHistory.map(p => p.id === optimisticallyUpdatedProject.id ? optimisticallyUpdatedProject : p)
                 .sort((a,b) => new Date(b.lastmodified).getTime() - new Date(a.lastmodified).getTime()) 
    );

    try {
      const { error } = await supabase
        .from('projects')
        .update({ stagescontent: updatedStagesContent, lastmodified: newLastModified }) 
        .eq('id', currentProject.id)
        .eq('user_id', session.user.id);

      if (error) {
        setCurrentProject(oldProject); 
        setProjectHistory(prevHistory => 
          prevHistory.map(p => p.id === oldProject.id ? oldProject : p)
                     .sort((a,b) => new Date(b.lastmodified).getTime() - new Date(a.lastmodified).getTime()) 
        );
        throw error;
      }
      await saveProjectVersion(optimisticallyUpdatedProject, `Stage: '${stageName}' Updated`);
    } catch (err: any) {
      const displayMessage = `Failed to save changes to cloud: ${err.message || err.error_description || 'Unknown error'}. Your local changes are temporarily active.`;
      console.error("Error updating stage content in Supabase:", displayMessage, "Original error:", err);
      setMappingError(displayMessage);
    }
  }, [currentProject, session, isGeneratingAllStages, saveProjectVersion, isRevertingVersionId]);
  
  const handleUpdateAllStagesContent = useCallback(async (allNewContents: Record<string, string>) => {
    if (!currentProject || !session?.user || isRevertingVersionId) {
      setToastMessage({ id: 'all-stages-save-err-auth', message: 'Cannot save: No active project or user session.', type: 'error', duration: 5000 });
      return;
    }
    
    setIsGeneratingAllStages(true);
    setMappingError(null);
    setToastMessage(null);
    const newLastModified = new Date().toISOString();

    const oldProject = { ...currentProject }; 
    const optimisticallyUpdatedProject: Project = {
      ...currentProject,
      stagescontent: allNewContents,
      lastmodified: newLastModified,
    };

    setCurrentProject(optimisticallyUpdatedProject);
    setProjectHistory(prevHistory =>
      prevHistory.map(p => p.id === optimisticallyUpdatedProject.id ? optimisticallyUpdatedProject : p)
                 .sort((a, b) => new Date(b.lastmodified).getTime() - new Date(a.lastmodified).getTime())
    );

    try {
      const { error } = await supabase
        .from('projects')
        .update({ stagescontent: allNewContents, lastmodified: newLastModified })
        .eq('id', currentProject.id)
        .eq('user_id', session.user.id);

      if (error) {
        setCurrentProject(oldProject); 
        setProjectHistory(prevHistory =>
          prevHistory.map(p => p.id === oldProject.id ? oldProject : p)
                     .sort((a, b) => new Date(b.lastmodified).getTime() - new Date(a.lastmodified).getTime())
        );
        throw error;
      }
      await saveProjectVersion(optimisticallyUpdatedProject, "Full Story Draft Applied");
      setToastMessage({ id: 'all-stages-save-succ', message: `"${currentProject.name}" updated with AI generated full draft.`, type: 'success', duration: 4000 });
    } catch (err: any) {
      const displayMessage = `Failed to save full story draft: ${err.message || err.error_description || 'Unknown error'}. Local changes are active.`;
      console.error("Error updating all stages content in Supabase:", displayMessage, "Original error:", err);
      setMappingError(displayMessage); 
      setToastMessage({ id: 'all-stages-save-fail', message: displayMessage, type: 'error', duration: 8000 });
    } finally {
      setIsGeneratingAllStages(false);
    }
  }, [currentProject, session, saveProjectVersion, isRevertingVersionId]);


  const handleAttemptDeleteProject = useCallback((projectIdToDelete: string) => {
    if (!session?.user) {
        setToastMessage({id: 'delete-auth-err', message: "Please log in to delete projects.", type: 'error', duration: 4000});
        return;
    }
    if (isProcessingDelete || isGeneratingAllStages || isRevertingVersionId) return;

    const project = projectHistory.find(p => p.id === projectIdToDelete);
    if (!project) {
        setToastMessage({id: `delete-notfound-${projectIdToDelete}`, message: "Project not found.", type: 'error', duration: 4000});
        return;
    }
    setProjectToDelete(project);
    setIsConfirmDeleteModalOpen(true);
    closeMobileMenu(); 
  }, [session, projectHistory, isProcessingDelete, closeMobileMenu, isGeneratingAllStages, isRevertingVersionId]);

  const handleCancelDeletion = useCallback(() => {
    setIsConfirmDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const executeDeleteFromDB = useCallback(async (projectToDeleteInstance: Project) => {
    if (!session?.user || !projectToDeleteInstance) {
      handleCancelDeletion(); 
      return;
    }
    
    setIsProcessingDelete(true);
    setToastMessage(null);

    try {
      const { error, count } = await supabase
        .from('projects')
        .delete({ count: 'exact' })
        .eq('id', projectToDeleteInstance.id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      if (count === 0) throw new Error("Project not found on server or already deleted.");
      if (count === null) throw new Error("Server did not confirm deletion count.");

      setProjectHistory(prev => prev.filter(p => p.id !== projectToDeleteInstance.id));
      if (currentProject?.id === projectToDeleteInstance.id) {
        handleStartNewStory(); 
      }
      
      setToastMessage({ 
        id: `deleted-${projectToDeleteInstance.id}`, 
        message: `"${projectToDeleteInstance.name}" permanently deleted.`, 
        type: 'success',
        duration: 4000
      });

    } catch (err: any) {
      const displayMessage = `Failed to delete "${projectToDeleteInstance.name}". Error: ${err.message || 'Unknown error'}`;
      console.error("Error executing delete from DB:", displayMessage, "Original error:", err);
      setToastMessage({
        id: `delete-fail-${projectToDeleteInstance.id}`,
        message: displayMessage,
        type: 'error',
        duration: 8000
      });
    } finally {
      setIsProcessingDelete(false);
    }
  }, [session, currentProject, handleStartNewStory, handleCancelDeletion]);

  const handleConfirmDeletion = useCallback(async () => {
    if (!projectToDelete) return;
    await executeDeleteFromDB(projectToDelete);
    setIsConfirmDeleteModalOpen(false);
    setProjectToDelete(null);
  }, [projectToDelete, executeDeleteFromDB]);

  const currentFrameworkDetails = STORY_FRAMEWORKS.find(f => f.id === selectedFrameworkId);

  useEffect(() => {
    if (!session) return; 
    if (userProfile && !userProfile.onboarding_completed && showOnboardingModal) return; // Don't change tab if onboarding

    if (currentProject && !isConfirmDeleteModalOpen && !isGeneratingAllStages && !isRevertingVersionId) setActiveBottomNavTab('projects');
    else if (isAwaitingProjectTitle || (selectedFrameworkId && !currentProject && !isLoadingMapping && !isConfirmDeleteModalOpen && !isGeneratingAllStages && !isRevertingVersionId)) setActiveBottomNavTab('frameworks');
    else if (!isLoadingMapping && !isAwaitingProjectTitle && !currentProject && !isConfirmDeleteModalOpen && !isGeneratingAllStages && !isRevertingVersionId) setActiveBottomNavTab('new');
  }, [currentProject, selectedFrameworkId, isAwaitingProjectTitle, isLoadingMapping, session, isConfirmDeleteModalOpen, isGeneratingAllStages, isRevertingVersionId, userProfile, showOnboardingModal]);

  const handleLogout = async () => {
    setIsLoadingAuth(true);
    setMappingError(null);
    setToastMessage(null);
    setIsConfirmDeleteModalOpen(false); 
    setProjectToDelete(null);
    setIsGeneratingAllStages(false);
    setIsRevertingVersionId(null);
    setIsProjectHistoryModalOpen(false);
    // User profile states will be reset by onAuthStateChange 'SIGNED_OUT' event

    const { error } = await supabase.auth.signOut();
    if (error) {
      const displayMessage = `Logout failed: ${error.message || 'Unknown error'}`;
      console.error('Error logging out:', displayMessage, "Original error:", error);
      setMappingError(displayMessage);
    }
    // No need to setIsLoadingAuth(false) here, onAuthStateChange will handle it.
  };

  const handleOpenUpgradeModal = (source: string) => {
    setUpgradeModalSource(source);
    setIsUpgradeModalOpen(true);
  };

  const handleCloseUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  const handleUpgradeToPro = () => {
    setUserSubscriptionTier(SubscriptionTier.PRO);
    handleCloseUpgradeModal();
    setToastMessage({
      id: 'upgrade-success',
      message: 'Successfully upgraded to Pro Plan!',
      type: 'success',
      duration: 5000
    });
    resetAIUsage(); 
  };

  const handleOpenProjectHistory = () => {
    if (currentProject) {
      fetchProjectVersions(currentProject.id);
      setIsProjectHistoryModalOpen(true);
    }
  };
  const handleCloseProjectHistoryModal = () => setIsProjectHistoryModalOpen(false);

  const handleOnboardingFinish = async (updatedProfileData: UserProfile) => {
    setUserProfile(updatedProfileData);
    setShowOnboardingModal(false);
    // Refetch project history as onboarding is now complete
    if(session?.user) {
      await fetchProjectHistory(session.user.id);
    }
  };

  const handleOnboardingSkip = async (skippedProfileData?: UserProfile) => {
     if (skippedProfileData) {
        setUserProfile(skippedProfileData);
     } else if (session?.user?.id) { // if skip happens before any data is entered, ensure profile is marked complete
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({ id: session.user.id, onboarding_completed: true }, { onConflict: 'id' })
            .select()
            .single();
        if (error) console.error("Error marking onboarding skipped:", error);
        else setUserProfile(data as UserProfile);
     }
    setShowOnboardingModal(false);
     if(session?.user) {
      await fetchProjectHistory(session.user.id);
    }
  };

  const globalLoading = isLoadingAuth || (session && isLoadingProfile && !showOnboardingModal); // Adjusted global loading condition

  if (globalLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center h-screen">
        <LoadingSpinner size="lg" text="Initializing StoryGenPro..." />
      </div>
    );
  }
  
  if (session && showOnboardingModal && currentUser) {
     return (
        <OnboardingModal
            userId={currentUser.id}
            onFinishOnboarding={handleOnboardingFinish}
            onSkipOnboarding={handleOnboardingSkip}
            initialProfileData={userProfile}
        />
     );
  }

  if (!session) {
    return <Auth />;
  }


  const renderMainContent = () => {
    // This condition means projects are loading for an already onboarded user.
    if (isLoadingData && !currentProject && projectHistory.length === 0 && !isAwaitingProjectTitle && !isLoadingMapping && !isGeneratingAllStages && !isRevertingVersionId) {
       return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center h-full">
          <LoadingSpinner size="lg" text="Loading your stories..." />
        </div>
      );
    }
    if (isLoadingMapping) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center h-full">
          <LoadingSpinner size="lg" text="AI is structuring your story..." />
        </div>
      );
    }
    if (isAwaitingProjectTitle && pendingProjectData && currentFrameworkDetails) {
      return (
        <ProjectTitleInputView
          frameworkName={currentFrameworkDetails.name}
          onSubmitTitle={handleProjectTitleSubmit}
          onCancel={handleCancelTitleInput}
        />
      );
    }
    
    if (currentProject && currentFrameworkDetails && currentProject.frameworkid === currentFrameworkDetails.id) {
      return (
        <StoryEditor 
          framework={currentFrameworkDetails} 
          currentProject={currentProject} 
          onUpdateStageContent={handleUpdateStageContent}
          onAcceptAllStagesContent={handleUpdateAllStagesContent} 
          isGeneratingAllStages={isGeneratingAllStages} 
          userSubscriptionTier={userSubscriptionTier}
          onOpenUpgradeModal={() => handleOpenUpgradeModal('editor_action')}
          checkAndIncrementAIUsage={checkAndIncrementAIUsage}
          projectVersions={projectVersions}
          onOpenProjectHistory={handleOpenProjectHistory}
          onRevertToVersion={handleRevertToVersion}
          isLoadingProjectVersions={isLoadingProjectVersions}
          isRevertingVersionId={isRevertingVersionId}
          isProjectHistoryModalOpen={isProjectHistoryModalOpen}
          onCloseProjectHistoryModal={handleCloseProjectHistoryModal}
        />
      );
    }
    // Default to IdeaEntryView if no other condition met (e.g., after onboarding, or if user starts new story)
    return (
      <IdeaEntryView
        rawStoryIdea={rawStoryIdea} 
        onIdeaChange={setRawStoryIdea}
        frameworks={STORY_FRAMEWORKS} 
        onSelectFramework={handleSelectFramework} 
        isMapping={isLoadingMapping}
        mappingError={mappingError}
        apiKeyMissing={!API_KEY}
        currentUser={currentUser}
        userProfile={userProfile} // Pass userProfile here
      />
    );
  };

  const isAnyOperationInProgress = isLoadingData || isLoadingMapping || isAwaitingProjectTitle || isProcessingDelete || isGeneratingAllStages || !!isRevertingVersionId;

  return (
    <div className="flex flex-col h-screen bg-stone-100 text-neutral-700">
      <Header 
        session={session} 
        onLogout={handleLogout} 
        userSubscriptionTier={userSubscriptionTier}
        onOpenUpgradeModal={() => handleOpenUpgradeModal('header_upgrade_button')}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          selectedFrameworkId={selectedFrameworkId}
          currentProjectId={currentProject?.id || null}
          onSelectFramework={handleSelectFramework} 
          onStartNewStory={handleStartNewStory}
          onLoadProject={handleLoadProject}
          projectHistory={projectHistory} 
          isProcessing={isAnyOperationInProgress} 
          onAttemptDeleteProject={handleAttemptDeleteProject}
          projectDeletingId={projectToDelete?.id || null} 
          isProcessingDelete={isProcessingDelete}
          userSubscriptionTier={userSubscriptionTier}
          onOpenUpgradeModal={() => handleOpenUpgradeModal('sidebar_action')}
        />
        <div className="flex-1 flex flex-col overflow-y-auto bg-stone-50 md:bg-white pb-16 md:pb-0">
          {mappingError && !isAwaitingProjectTitle && !isLoadingMapping && !isGeneratingAllStages && !isRevertingVersionId && (
             <div className="p-3 m-4 bg-red-500/10 border border-red-500/30 text-red-700 rounded-lg w-auto shadow-sm text-xs sm:text-sm" role="alert">
              <p className="font-semibold">Error:</p>
              <p>{mappingError}</p>
            </div>
          )}
          {renderMainContent()}
        </div>
      </div>
      <BottomNavBar 
        onOpenMobileMenu={openMobileMenu}
        onStartNewStory={handleStartNewStory}
        activeView={activeBottomNavTab}
      />
      {isMobileMenuOpen && mobileMenuView && (
        <MobileMenuModal
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          viewType={mobileMenuView}
          projectHistory={projectHistory} 
          selectedFrameworkId={selectedFrameworkId}
          currentProjectId={currentProject?.id || null}
          onSelectFramework={handleSelectFramework}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleAttemptDeleteProject} 
          isProcessing={isAnyOperationInProgress}
          projectDeletingId={projectToDelete?.id || null}
          isProcessingDelete={isProcessingDelete}
        />
      )}
      <ToastNotifications toast={toastMessage} onClose={() => setToastMessage(null)} />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={handleCancelDeletion}
        onConfirm={handleConfirmDeletion}
        projectName={projectToDelete?.name || ''}
        isDeleting={isProcessingDelete}
      />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={handleCloseUpgradeModal}
        onUpgrade={handleUpgradeToPro}
        sourceFeature={upgradeModalSource}
      />
    </div>
  );
};

export default App;
