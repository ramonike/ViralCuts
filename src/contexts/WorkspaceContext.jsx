import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within WorkspaceProvider');
    }
    return context;
};

export const WorkspaceProvider = ({ children }) => {
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load workspaces from Supabase
    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Load workspaces from database
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setWorkspaces(data || []);

            // Set active workspace (first one or from localStorage)
            const savedActiveId = localStorage.getItem('activeWorkspaceId');
            if (savedActiveId && data?.find(w => w.id === savedActiveId)) {
                setActiveWorkspaceId(savedActiveId);
            } else if (data && data.length > 0) {
                setActiveWorkspaceId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async (workspaceData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const newWorkspace = {
                user_id: user.id,
                name: workspaceData.name,
                channel_id: workspaceData.channelId,
                color: workspaceData.color || '#0ea5e9',
                icon: workspaceData.icon || '📺',
                layout: workspaceData.layout || { widgets: [] },
                settings: workspaceData.settings || {},
            };

            const { data, error } = await supabase
                .from('workspaces')
                .insert([newWorkspace])
                .select()
                .single();

            if (error) throw error;

            setWorkspaces([...workspaces, data]);
            setActiveWorkspaceId(data.id);

            return data;
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    };

    const updateWorkspace = async (workspaceId, updates) => {
        try {
            const { data, error } = await supabase
                .from('workspaces')
                .update(updates)
                .eq('id', workspaceId)
                .select()
                .single();

            if (error) throw error;

            setWorkspaces(workspaces.map(w => w.id === workspaceId ? data : w));

            return data;
        } catch (error) {
            console.error('Error updating workspace:', error);
            throw error;
        }
    };

    const deleteWorkspace = async (workspaceId) => {
        try {
            const { error } = await supabase
                .from('workspaces')
                .delete()
                .eq('id', workspaceId);

            if (error) throw error;

            const newWorkspaces = workspaces.filter(w => w.id !== workspaceId);
            setWorkspaces(newWorkspaces);

            // Switch to another workspace if deleting active one
            if (activeWorkspaceId === workspaceId && newWorkspaces.length > 0) {
                setActiveWorkspaceId(newWorkspaces[0].id);
            }
        } catch (error) {
            console.error('Error deleting workspace:', error);
            throw error;
        }
    };

    const switchWorkspace = (workspaceId) => {
        setActiveWorkspaceId(workspaceId);
        localStorage.setItem('activeWorkspaceId', workspaceId);
    };

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const value = {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        loading,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        switchWorkspace,
        refreshWorkspaces: loadWorkspaces,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export default WorkspaceContext;
