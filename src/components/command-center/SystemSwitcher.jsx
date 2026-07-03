/**
 * System Switcher Component
 * Allows users to switch between Command Center and Journey systems
 * Requirements: 9.4, 9.5
 */

import React, { useState, useCallback } from 'react';
import { ArrowLeftRight, Sparkles, Map, AlertCircle, CheckCircle } from 'lucide-react';
import { getMigrationService, getActiveSystem } from './MigrationService';

/**
 * System Switcher Button - Compact toggle for switching systems
 * @param {Object} props
 * @param {Function} props.onSwitch - Callback when system is switched
 * @param {string} props.className - Additional CSS classes
 */
export function SystemSwitcherButton({ onSwitch, className = '' }) {
  const [activeSystem, setActiveSystem] = useState(() => getActiveSystem());
  const [isLoading, setIsLoading] = useState(false);
  const migrationService = getMigrationService();

  const handleSwitch = useCallback(async () => {
    setIsLoading(true);
    try {
      const newSystem = activeSystem === 'command-center' ? 'journey' : 'command-center';
      
      if (newSystem === 'journey') {
        migrationService.switchToJourney();
      } else {
        migrationService.switchToCommandCenter();
      }
      
      setActiveSystem(newSystem);
      onSwitch?.(newSystem);
    } finally {
      setIsLoading(false);
    }
  }, [activeSystem, migrationService, onSwitch]);

  return (
    <button
      onClick={handleSwitch}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200
        ${activeSystem === 'command-center' 
          ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' 
          : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={`Alternar para ${activeSystem === 'command-center' ? 'Jornada do Criador' : 'Centro de Comando'}`}
    >
      <ArrowLeftRight className="w-3 h-3" />
      <span>
        {isLoading ? 'Alternando...' : (
          activeSystem === 'command-center' ? 'Usar Jornada' : 'Usar Centro de Comando'
        )}
      </span>
    </button>
  );
}

/**
 * System Switcher Panel - Full panel for system selection with details
 * @param {Object} props
 * @param {Function} props.onSwitch - Callback when system is switched
 * @param {Function} props.onClose - Callback to close the panel
 */
export function SystemSwitcherPanel({ onSwitch, onClose }) {
  const [activeSystem, setActiveSystem] = useState(() => getActiveSystem());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const migrationService = getMigrationService();

  const handleSelectSystem = useCallback((system) => {
    if (system === activeSystem) return;
    setShowConfirmation(true);
  }, [activeSystem]);

  const handleConfirmSwitch = useCallback(async () => {
    setIsLoading(true);
    try {
      const newSystem = activeSystem === 'command-center' ? 'journey' : 'command-center';
      
      if (newSystem === 'journey') {
        migrationService.switchToJourney();
      } else {
        migrationService.switchToCommandCenter();
      }
      
      setActiveSystem(newSystem);
      setShowConfirmation(false);
      onSwitch?.(newSystem);
    } finally {
      setIsLoading(false);
    }
  }, [activeSystem, migrationService, onSwitch]);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading-sm text-white">Escolher Interface</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {showConfirmation ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Confirmar alteração</p>
              <p className="text-xs text-amber-300/80 mt-1">
                {activeSystem === 'command-center' 
                  ? 'Você voltará para a Jornada do Criador. Seus dados serão preservados.'
                  : 'Você usará o novo Centro de Comando. Seus dados serão migrados automaticamente.'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-[var(--bg-elevated)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSwitch}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Alternando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Command Center Option */}
          <button
            onClick={() => handleSelectSystem('command-center')}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${activeSystem === 'command-center'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${activeSystem === 'command-center' ? 'bg-purple-500' : 'bg-[var(--bg-elevated)]'}
              `}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Centro de Comando</span>
                  {activeSystem === 'command-center' && (
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
                    NOVO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Interface focada em produtividade diária com planejamento, métricas e ações rápidas.
                </p>
              </div>
            </div>
          </button>

          {/* Journey Option */}
          <button
            onClick={() => handleSelectSystem('journey')}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${activeSystem === 'journey'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${activeSystem === 'journey' ? 'bg-blue-500' : 'bg-[var(--bg-elevated)]'}
              `}>
                <Map className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Jornada do Criador</span>
                  {activeSystem === 'journey' && (
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Interface clássica com roadmap de etapas, conquistas e progresso gamificado.
                </p>
              </div>
            </div>
          </button>

          <p className="text-[10px] text-slate-500 text-center mt-2">
            Você pode alternar entre as interfaces a qualquer momento. Seus dados são preservados.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing system switching
 * @returns {Object} System switching utilities
 */
export function useSystemSwitcher() {
  const [activeSystem, setActiveSystem] = useState(() => getActiveSystem());
  const [isLoading, setIsLoading] = useState(false);
  const migrationService = getMigrationService();

  const switchToCommandCenter = useCallback(async () => {
    setIsLoading(true);
    try {
      migrationService.switchToCommandCenter();
      setActiveSystem('command-center');
      return true;
    } catch (error) {
      console.error('[useSystemSwitcher] Error switching to command center:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [migrationService]);

  const switchToJourney = useCallback(async () => {
    setIsLoading(true);
    try {
      migrationService.switchToJourney();
      setActiveSystem('journey');
      return true;
    } catch (error) {
      console.error('[useSystemSwitcher] Error switching to journey:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [migrationService]);

  const toggleSystem = useCallback(async () => {
    if (activeSystem === 'command-center') {
      return switchToJourney();
    } else {
      return switchToCommandCenter();
    }
  }, [activeSystem, switchToCommandCenter, switchToJourney]);

  return {
    activeSystem,
    isLoading,
    switchToCommandCenter,
    switchToJourney,
    toggleSystem,
    isCommandCenter: activeSystem === 'command-center',
    isJourney: activeSystem === 'journey',
  };
}

/**
 * Conditional Renderer - Renders children based on active system
 * @param {Object} props
 * @param {React.ReactNode} props.commandCenter - Content for command center
 * @param {React.ReactNode} props.journey - Content for journey system
 */
export function SystemConditionalRender({ commandCenter, journey }) {
  const activeSystem = getActiveSystem();
  
  if (activeSystem === 'command-center') {
    return commandCenter || null;
  }
  
  return journey || null;
}

export default SystemSwitcherPanel;
