import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import {
    Search, Upload, Calendar, Settings, LayoutDashboard,
    UserCircle, TrendingUp, DollarSign, Zap, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const { workspaces, switchWorkspace } = useWorkspace();

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = useCallback((callback) => {
        setOpen(false);
        callback();
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[640px] px-4">
                <Command className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center border-b border-slate-700 px-4">
                        <Search className="w-5 h-5 text-slate-400 mr-3" />
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Digite um comando ou busque..."
                            className="w-full bg-transparent py-4 text-white placeholder:text-slate-400 outline-none"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-900 rounded border border-slate-700">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-slate-400">
                            Nenhum resultado encontrado.
                        </Command.Empty>

                        {/* Quick Actions */}
                        <Command.Group heading="Ações Rápidas" className="text-xs text-slate-400 px-2 py-1.5 font-semibold">
                            <CommandItem
                                icon={<Upload className="w-4 h-4" />}
                                label="Fazer Upload de Vídeo"
                                shortcut="U"
                                onSelect={() => handleSelect(() => navigate('/dashboard?action=upload'))}
                            />
                            <CommandItem
                                icon={<Calendar className="w-4 h-4" />}
                                label="Agendar Vídeo"
                                shortcut="S"
                                onSelect={() => handleSelect(() => navigate('/dashboard?action=schedule'))}
                            />
                            <CommandItem
                                icon={<FileText className="w-4 h-4" />}
                                label="Nova Checklist"
                                shortcut="C"
                                onSelect={() => handleSelect(() => console.log('Create checklist'))}
                            />
                        </Command.Group>

                        {/* Navigation */}
                        <Command.Group heading="Navegação" className="text-xs text-slate-400 px-2 py-1.5 font-semibold mt-2">
                            <CommandItem
                                icon={<LayoutDashboard className="w-4 h-4" />}
                                label="Dashboard"
                                onSelect={() => handleSelect(() => navigate('/dashboard'))}
                            />
                            <CommandItem
                                icon={<UserCircle className="w-4 h-4" />}
                                label="Perfil & Conexões"
                                onSelect={() => handleSelect(() => navigate('/dashboard?tab=profile'))}
                            />
                            <CommandItem
                                icon={<TrendingUp className="w-4 h-4" />}
                                label="Analytics"
                                badge="Premium"
                                onSelect={() => handleSelect(() => console.log('Analytics'))}
                            />
                            <CommandItem
                                icon={<Settings className="w-4 h-4" />}
                                label="Configurações"
                                onSelect={() => handleSelect(() => navigate('/dashboard?tab=settings'))}
                            />
                        </Command.Group>

                        {/* Workspaces */}
                        {workspaces.length > 0 && (
                            <Command.Group heading="Workspaces" className="text-xs text-slate-400 px-2 py-1.5 font-semibold mt-2">
                                {workspaces.map((workspace) => (
                                    <CommandItem
                                        key={workspace.id}
                                        icon={<span className="text-base">{workspace.icon}</span>}
                                        label={workspace.name}
                                        onSelect={() => handleSelect(() => switchWorkspace(workspace.id))}
                                    />
                                ))}
                            </Command.Group>
                        )}

                        {/* Tools */}
                        <Command.Group heading="Ferramentas" className="text-xs text-slate-400 px-2 py-1.5 font-semibold mt-2">
                            <CommandItem
                                icon={<Zap className="w-4 h-4" />}
                                label="Vizard.ai"
                                onSelect={() => handleSelect(() => window.open('https://vizard.ai', '_blank'))}
                            />
                            <CommandItem
                                icon={<Zap className="w-4 h-4" />}
                                label="OpusClip"
                                onSelect={() => handleSelect(() => window.open('https://opus.pro', '_blank'))}
                            />
                        </Command.Group>
                    </Command.List>

                    {/* Footer */}
                    <div className="border-t border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700">↓</kbd>
                                <span>navegar</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700">↵</kbd>
                                <span>selecionar</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700">ESC</kbd>
                            <span>fechar</span>
                        </div>
                    </div>
                </Command>
            </div>

            {/* Click outside to close */}
            <div
                className="absolute inset-0 -z-10"
                onClick={() => setOpen(false)}
            />
        </div>
    );
};

const CommandItem = ({ icon, label, shortcut, badge, onSelect }) => {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="text-slate-400 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <span className="text-sm text-white">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {badge && (
                    <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                        {badge}
                    </span>
                )}
                {shortcut && (
                    <kbd className="px-1.5 py-0.5 text-xs text-slate-400 bg-slate-900 rounded border border-slate-700">
                        {shortcut}
                    </kbd>
                )}
            </div>
        </Command.Item>
    );
};

export default CommandPalette;
