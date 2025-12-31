import React, { useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Button } from '../ui/button';
import { ChevronDown, Plus, Check, Settings, Trash2 } from 'lucide-react';

export const WorkspaceSwitcher = () => {
    const { workspaces, activeWorkspace, switchWorkspace, createWorkspace, deleteWorkspace } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;

        try {
            await createWorkspace({
                name: newWorkspaceName,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
            });
            setNewWorkspaceName('');
            setShowCreateForm(false);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create workspace:', error);
        }
    };

    const handleDeleteWorkspace = async (workspaceId, e) => {
        e.stopPropagation();
        if (workspaces.length <= 1) {
            alert('Você precisa ter pelo menos um workspace');
            return;
        }

        if (window.confirm('Tem certeza que deseja deletar este workspace?')) {
            try {
                await deleteWorkspace(workspaceId);
            } catch (error) {
                console.error('Failed to delete workspace:', error);
            }
        }
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full sm:min-w-[180px] lg:min-w-[220px] justify-between border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white px-3 py-1.5 h-auto"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{activeWorkspace?.icon || '📺'}</span>
                    <span className="font-bold truncate text-xs sm:text-sm">
                        {activeWorkspace?.name || 'Workspace'}
                    </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-[280px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        {/* Workspace List */}
                        <div className="max-h-[300px] overflow-y-auto">
                            {workspaces.map((workspace) => (
                                <div
                                    key={workspace.id}
                                    onClick={() => {
                                        switchWorkspace(workspace.id);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors ${workspace.id === activeWorkspace?.id ? 'bg-slate-700/50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-xl">{workspace.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{workspace.name}</p>
                                            {workspace.channel_id && (
                                                <p className="text-xs text-slate-400 truncate">{workspace.channel_id}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {workspace.id === activeWorkspace?.id && (
                                            <Check className="w-4 h-4 text-primary-500" />
                                        )}
                                        {workspaces.length > 1 && (
                                            <button
                                                onClick={(e) => handleDeleteWorkspace(workspace.id, e)}
                                                className="p-1 hover:bg-slate-600 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Create New Workspace */}
                        <div className="border-t border-slate-700">
                            {showCreateForm ? (
                                <form onSubmit={handleCreateWorkspace} className="p-3">
                                    <input
                                        type="text"
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        placeholder="Nome do workspace..."
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="flex-1 bg-primary-600 hover:bg-primary-700"
                                        >
                                            Criar
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setNewWorkspaceName('');
                                            }}
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-700 transition-colors text-primary-400"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="font-medium">Novo Workspace</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkspaceSwitcher;
