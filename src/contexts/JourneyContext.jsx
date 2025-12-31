import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_JOURNEY_STAGES, DEFAULT_ACHIEVEMENTS } from '../types/journey';
import { progressAPI, achievementsAPI, offlineFirst, syncManager } from '../api/backend';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { createNotificationTriggers } from '../services/notificationTriggers';

const JourneyContext = createContext();

// Local storage keys
const STORAGE_KEYS = {
    journeyState: 'viralcuts-journey-state',
    stages: 'viralcuts-journey-stages',
    userStats: 'viralcuts-user-stats',
    lastSync: 'viralcuts-journey-last-sync'
};

// Default states
const DEFAULT_JOURNEY_STATE = {
    currentStage: 'setup',
    completedMilestones: [],
    progressPercentage: 0,
    experienceLevel: 'beginner',
    onboardingCompleted: false,
    lastActiveDate: new Date(),
    isFirstLogin: true
};

const DEFAULT_USER_STATS = {
    videosCreated: 0,
    toolsUsed: [],
    channelOptimizationScore: 0,
    daysActive: 0,
    totalPoints: 0,
    achievements: [],
    currentStreak: 0
};

export const useJourney = () => {
    const context = useContext(JourneyContext);
    if (!context) {
        throw new Error('useJourney must be used within a JourneyProvider');
    }
    return context;
};

export const JourneyProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'error'
    const syncInProgress = useRef(false);
    
    // Get notification context for achievement notifications
    const notificationContext = useNotification();
    const notificationTriggers = notificationContext ? createNotificationTriggers(notificationContext) : null;

    // Initialize state from localStorage
    const [journeyState, setJourneyState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.journeyState);
        return saved ? JSON.parse(saved) : DEFAULT_JOURNEY_STATE;
    });

    const [stages, setStages] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.stages);
        return saved ? JSON.parse(saved) : DEFAULT_JOURNEY_STAGES;
    });

    const [userStats, setUserStats] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.userStats);
        return saved ? JSON.parse(saved) : DEFAULT_USER_STATS;
    });

    // Save to localStorage whenever state changes (offline-first)
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.journeyState, JSON.stringify(journeyState));
    }, [journeyState]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(stages));
    }, [stages]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.userStats, JSON.stringify(userStats));
    }, [userStats]);

    // Load data from backend on mount when user is authenticated
    useEffect(() => {
        if (authLoading) return;
        
        const loadFromBackend = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                setSyncStatus('syncing');
                
                // Fetch progress and achievements in parallel
                const [progressData, achievementsData] = await Promise.all([
                    progressAPI.get().catch(() => null),
                    achievementsAPI.list().catch(() => null)
                ]);

                // Update state from backend if data exists
                if (progressData) {
                    setJourneyState(prev => ({
                        ...prev,
                        currentStage: progressData.currentStage || prev.currentStage,
                        completedMilestones: progressData.completedMilestones || prev.completedMilestones,
                        experienceLevel: progressData.experienceLevel || prev.experienceLevel,
                        onboardingCompleted: progressData.onboardingCompleted ?? prev.onboardingCompleted,
                        lastActiveDate: progressData.lastActiveDate ? new Date(progressData.lastActiveDate) : prev.lastActiveDate,
                        isFirstLogin: false
                    }));

                    setUserStats(prev => ({
                        ...prev,
                        totalPoints: progressData.totalPoints ?? prev.totalPoints,
                        currentStreak: progressData.currentStreak ?? prev.currentStreak
                    }));
                }

                if (achievementsData && Array.isArray(achievementsData)) {
                    // Map backend achievements to full achievement objects
                    const unlockedAchievements = achievementsData.map(a => {
                        const achievementDef = DEFAULT_ACHIEVEMENTS.find(def => def.id === a.achievementId);
                        return achievementDef ? {
                            ...achievementDef,
                            unlockedAt: new Date(a.unlockedAt)
                        } : null;
                    }).filter(Boolean);

                    setUserStats(prev => ({
                        ...prev,
                        achievements: unlockedAchievements
                    }));
                }

                // Process any pending changes
                await syncManager.processPendingChanges();
                
                localStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());
                setSyncStatus('idle');
            } catch (error) {
                console.error('Failed to load journey data from backend:', error);
                setSyncStatus('error');
                // Continue with localStorage data (offline-first)
            } finally {
                setIsLoading(false);
            }
        };

        loadFromBackend();
    }, [user, authLoading]);

    // Enable auto-sync when coming back online
    useEffect(() => {
        syncManager.enableAutoSync();
    }, []);

    const calculateProgress = useCallback((stageId) => {
        const stage = stages.find(s => s.id === stageId);
        if (!stage) return 0;
        
        const completedMilestones = stage.milestones.filter(m => 
            journeyState.completedMilestones.includes(m.id)
        ).length;
        
        return Math.round((completedMilestones / stage.milestones.length) * 100);
    }, [stages, journeyState.completedMilestones]);

    const syncProgressToBackend = useCallback(async (newState, newStats) => {
        if (!user || syncInProgress.current) return;
        
        syncInProgress.current = true;
        try {
            await offlineFirst.updateProgress({
                currentStage: newState.currentStage,
                completedMilestones: newState.completedMilestones,
                experienceLevel: newState.experienceLevel,
                totalPoints: newStats.totalPoints,
                currentStreak: newStats.currentStreak,
                onboardingCompleted: newState.onboardingCompleted
            }, null);
        } catch (error) {
            console.error('Failed to sync progress to backend:', error);
        } finally {
            syncInProgress.current = false;
        }
    }, [user]);

    const updateProgress = useCallback(async (milestoneId) => {
        if (journeyState.completedMilestones.includes(milestoneId)) return;

        const newCompletedMilestones = [...journeyState.completedMilestones, milestoneId];
        
        // Find the milestone to get points
        const milestone = stages
            .flatMap(s => s.milestones)
            .find(m => m.id === milestoneId);
        
        let newStats = userStats;
        if (milestone) {
            newStats = {
                ...userStats,
                totalPoints: userStats.totalPoints + milestone.points
            };
            setUserStats(newStats);
        }

        // Update journey state
        const newJourneyState = {
            ...journeyState,
            completedMilestones: newCompletedMilestones,
            lastActiveDate: new Date()
        };
        setJourneyState(newJourneyState);

        // Sync to backend with offline support
        if (user) {
            try {
                await offlineFirst.completeMilestone(milestoneId, milestone?.points || 0, null);
            } catch (error) {
                console.error('Failed to sync milestone completion:', error);
            }
        }

        // Check if stage is completed and unlock next stage
        const currentStage = stages.find(s => s.id === journeyState.currentStage);
        if (currentStage) {
            const stageProgress = calculateProgress(currentStage.id);
            if (stageProgress === 100) {
                completeStage(currentStage.id);
            }
        }
    }, [journeyState, stages, userStats, user, calculateProgress]);

    const completeStage = useCallback((stageId) => {
        setStages(prev => prev.map(stage => {
            if (stage.id === stageId) {
                return { ...stage, unlocked: true };
            }
            // Unlock next stage
            if (stage.order === prev.find(s => s.id === stageId)?.order + 1) {
                return { ...stage, unlocked: true };
            }
            return stage;
        }));

        // Move to next stage if current
        const completedStage = stages.find(s => s.id === stageId);
        if (completedStage && journeyState.currentStage === stageId) {
            const nextStage = stages.find(s => s.order === completedStage.order + 1);
            if (nextStage) {
                const newJourneyState = {
                    ...journeyState,
                    currentStage: nextStage.id
                };
                setJourneyState(newJourneyState);
                
                // Sync stage change to backend
                if (user) {
                    syncProgressToBackend(newJourneyState, userStats);
                }
            }
        }

        // Check for achievements
        checkAchievements(stageId);
    }, [stages, journeyState, user, userStats, syncProgressToBackend]);

    const unlockAchievement = useCallback(async (achievementId) => {
        const achievement = DEFAULT_ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        const alreadyUnlocked = userStats.achievements.some(a => a.id === achievementId);
        if (alreadyUnlocked) return;

        const unlockedAchievement = {
            ...achievement,
            unlockedAt: new Date()
        };

        const newStats = {
            ...userStats,
            achievements: [...userStats.achievements, unlockedAchievement],
            totalPoints: userStats.totalPoints + achievement.points
        };
        setUserStats(newStats);

        // Sync to backend with offline support
        if (user) {
            try {
                await offlineFirst.unlockAchievement(achievementId, null);
            } catch (error) {
                console.error('Failed to sync achievement unlock:', error);
            }
        }

        // Trigger achievement notification (Requirements: 2.3)
        notificationTriggers?.triggerAchievementUnlocked({
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon || '🏆',
            points: achievement.points,
        });

        console.log(`🏆 Achievement Unlocked: ${achievement.title}`);
    }, [userStats, user, notificationTriggers]);

    const checkAchievements = useCallback((completedStageId) => {
        // First connection achievement
        if (journeyState.completedMilestones.includes('youtube-connection')) {
            unlockAchievement('first-connection');
        }

        // Channel optimizer achievement
        const setupMilestones = ['youtube-connection', 'channel-photo', 'channel-banner', 'channel-description'];
        const completedSetup = setupMilestones.every(m => journeyState.completedMilestones.includes(m));
        if (completedSetup) {
            unlockAchievement('channel-optimizer');
        }

        // AI Explorer achievement
        const aiTools = ['vizard', 'opus', 'klap', 'submagic'];
        const usedAllAI = aiTools.every(tool => userStats.toolsUsed.includes(tool));
        if (usedAllAI) {
            unlockAchievement('ai-explorer');
        }
    }, [journeyState.completedMilestones, userStats.toolsUsed, unlockAchievement]);

    const setExperienceLevel = useCallback((level) => {
        const newJourneyState = {
            ...journeyState,
            experienceLevel: level
        };
        setJourneyState(newJourneyState);

        // Sync to backend
        if (user) {
            syncProgressToBackend(newJourneyState, userStats);
        }
    }, [journeyState, user, userStats, syncProgressToBackend]);

    const resetJourney = useCallback(() => {
        setJourneyState(DEFAULT_JOURNEY_STATE);
        setStages(DEFAULT_JOURNEY_STAGES);
        setUserStats(DEFAULT_USER_STATS);
        
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.journeyState);
        localStorage.removeItem(STORAGE_KEYS.stages);
        localStorage.removeItem(STORAGE_KEYS.userStats);
        localStorage.removeItem(STORAGE_KEYS.lastSync);
    }, []);

    const markToolUsed = useCallback((toolName) => {
        setUserStats(prev => ({
            ...prev,
            toolsUsed: prev.toolsUsed.includes(toolName) 
                ? prev.toolsUsed 
                : [...prev.toolsUsed, toolName]
        }));
    }, []);

    const incrementVideoCount = useCallback(() => {
        setUserStats(prev => ({
            ...prev,
            videosCreated: prev.videosCreated + 1
        }));
    }, []);

    const value = {
        journeyState,
        stages,
        userStats,
        isLoading,
        syncStatus,
        updateProgress,
        completeStage,
        unlockAchievement,
        setExperienceLevel,
        resetJourney,
        markToolUsed,
        incrementVideoCount,
        calculateProgress
    };

    return (
        <JourneyContext.Provider value={value}>
            {children}
        </JourneyContext.Provider>
    );
};
