/**
 * WidgetCustomization Component
 * Provides widget order and visibility customization
 * 
 * Requirements: 8.3, 8.5
 * - Allow users to customize widget order and visibility
 * - Remember user layout preferences and restore them on subsequent visits
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import { GripVertical, Eye, EyeOff, RotateCcw, Settings, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

// ============================================
// STORAGE KEYS
// ============================================

const WIDGET_ORDER_KEY = 'command-center-widget-order';
const WIDGET_VISIBILITY_KEY = 'command-center-widget-visibility';
const LAYOUT_PREFERENCES_KEY = 'command-center-layout-preferences';

// ============================================
// DEFAULT WIDGET CONFIGURATION
// ============================================

/**
 * Default widget definitions
 */
export const DEFAULT_WIDGETS = [
  { id: 'setup-assistant', name: 'Setup Assistant', description: 'Initial setup checklist', defaultVisible: true },
  { id: 'daily-planner', name: 'Daily Planner', description: 'Daily task recommendations', defaultVisible: true },
  { id: 'quick-actions', name: 'Quick Actions', description: 'Common action buttons', defaultVisible: true },
  { id: 'progress-dashboard', name: 'Progress Dashboard', description: 'Metrics and streaks', defaultVisible: true },
  { id: 'content-workflow', name: 'Content Workflow', description: 'Guided content creation', defaultVisible: true },
  { id: 'smart-suggestions', name: 'Smart Suggestions', description: 'AI-powered recommendations', defaultVisible: true },
  { id: 'notifications', name: 'Notifications', description: 'Alerts and updates', defaultVisible: true },
];

// ============================================
// WIDGET CUSTOMIZATION CONTEXT
// ============================================

const WidgetCustomizationContext = createContext(null);

/**
 * Hook to access widget customization context
 * @returns {WidgetCustomizationContextValue}
 */
export function useWidgetCustomization() {
  const context = useContext(WidgetCustomizationContext);
  if (!context) {
    throw new Error('useWidgetCustomization must be used within WidgetCustomizationProvider');
  }
  return context;
}

// ============================================
// STORAGE UTILITIES
// ============================================

/**
 * Load data from localStorage with fallback
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Stored or default value
 */
function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

// ============================================
// WIDGET CUSTOMIZATION PROVIDER
// ============================================

/**
 * WidgetCustomizationProvider Component
 * Manages widget order and visibility state
 * Requirements: 8.3, 8.5
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Array} props.availableWidgets - Available widget definitions
 * @param {Function} props.onLayoutChange - Callback when layout changes
 */
export function WidgetCustomizationProvider({ 
  children, 
  availableWidgets = DEFAULT_WIDGETS,
  onLayoutChange,
}) {
  // Initialize state from localStorage
  // Requirements: 8.5 - Remember user layout preferences
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const stored = loadFromStorage(WIDGET_ORDER_KEY, null);
    return stored || availableWidgets.map(w => w.id);
  });
  
  const [widgetVisibility, setWidgetVisibility] = useState(() => {
    const stored = loadFromStorage(WIDGET_VISIBILITY_KEY, null);
    if (stored) return stored;
    
    // Default visibility from widget definitions
    return availableWidgets.reduce((acc, widget) => {
      acc[widget.id] = widget.defaultVisible !== false;
      return acc;
    }, {});
  });
  
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Persist changes to localStorage
  // Requirements: 8.5 - Remember user layout preferences
  useEffect(() => {
    saveToStorage(WIDGET_ORDER_KEY, widgetOrder);
  }, [widgetOrder]);
  
  useEffect(() => {
    saveToStorage(WIDGET_VISIBILITY_KEY, widgetVisibility);
  }, [widgetVisibility]);
  
  // Notify parent of layout changes
  // Requirements: 8.5 - Remember user layout preferences
  // Use ref to prevent infinite loops when onLayoutChange changes
  const onLayoutChangeRef = useRef(onLayoutChange);
  onLayoutChangeRef.current = onLayoutChange;
  
  useEffect(() => {
    if (onLayoutChangeRef.current) {
      onLayoutChangeRef.current({ widgetOrder, widgetVisibility });
    }
  }, [widgetOrder, widgetVisibility]);
  
  // Reorder widgets
  // Requirements: 8.3 - Allow users to customize widget order
  const reorderWidgets = useCallback((fromIndex, toIndex) => {
    setWidgetOrder(prev => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return newOrder;
    });
  }, []);
  
  // Move widget up in order
  const moveWidgetUp = useCallback((widgetId) => {
    setWidgetOrder(prev => {
      const index = prev.indexOf(widgetId);
      if (index <= 0) return prev;
      
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  }, []);
  
  // Move widget down in order
  const moveWidgetDown = useCallback((widgetId) => {
    setWidgetOrder(prev => {
      const index = prev.indexOf(widgetId);
      if (index < 0 || index >= prev.length - 1) return prev;
      
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  }, []);
  
  // Toggle widget visibility
  // Requirements: 8.3 - Allow users to customize widget visibility
  const toggleWidgetVisibility = useCallback((widgetId) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  }, []);
  
  // Set widget visibility
  const setWidgetVisible = useCallback((widgetId, visible) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widgetId]: visible,
    }));
  }, []);
  
  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultOrder = availableWidgets.map(w => w.id);
    const defaultVisibility = availableWidgets.reduce((acc, widget) => {
      acc[widget.id] = widget.defaultVisible !== false;
      return acc;
    }, {});
    
    setWidgetOrder(defaultOrder);
    setWidgetVisibility(defaultVisibility);
  }, [availableWidgets]);
  
  // Get ordered and filtered widgets
  const getOrderedWidgets = useCallback(() => {
    return widgetOrder
      .map(id => availableWidgets.find(w => w.id === id))
      .filter(Boolean);
  }, [widgetOrder, availableWidgets]);
  
  // Get visible widgets in order
  const getVisibleWidgets = useCallback(() => {
    return getOrderedWidgets().filter(widget => widgetVisibility[widget.id]);
  }, [getOrderedWidgets, widgetVisibility]);
  
  // Check if widget is visible
  const isWidgetVisible = useCallback((widgetId) => {
    return widgetVisibility[widgetId] !== false;
  }, [widgetVisibility]);
  
  // Context value
  const contextValue = useMemo(() => ({
    widgetOrder,
    widgetVisibility,
    isCustomizing,
    setIsCustomizing,
    reorderWidgets,
    moveWidgetUp,
    moveWidgetDown,
    toggleWidgetVisibility,
    setWidgetVisible,
    resetToDefaults,
    getOrderedWidgets,
    getVisibleWidgets,
    isWidgetVisible,
    availableWidgets,
  }), [
    widgetOrder,
    widgetVisibility,
    isCustomizing,
    reorderWidgets,
    moveWidgetUp,
    moveWidgetDown,
    toggleWidgetVisibility,
    setWidgetVisible,
    resetToDefaults,
    getOrderedWidgets,
    getVisibleWidgets,
    isWidgetVisible,
    availableWidgets,
  ]);
  
  return (
    <WidgetCustomizationContext.Provider value={contextValue}>
      {children}
    </WidgetCustomizationContext.Provider>
  );
}

// ============================================
// WIDGET CUSTOMIZATION PANEL
// ============================================

/**
 * WidgetCustomizationPanel Component
 * UI for customizing widget order and visibility
 * Requirements: 8.3 - Allow users to customize widget order and visibility
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is open
 * @param {Function} props.onClose - Close handler
 */
export function WidgetCustomizationPanel({ isOpen, onClose }) {
  const {
    widgetOrder,
    widgetVisibility,
    moveWidgetUp,
    moveWidgetDown,
    toggleWidgetVisibility,
    resetToDefaults,
    availableWidgets,
  } = useWidgetCustomization();
  
  const [draggedWidget, setDraggedWidget] = useState(null);
  
  if (!isOpen) return null;
  
  // Get widget info by ID
  const getWidgetInfo = (id) => availableWidgets.find(w => w.id === id);
  
  // Handle drag start
  const handleDragStart = (e, widgetId) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;
    
    const fromIndex = widgetOrder.indexOf(draggedWidget);
    const toIndex = widgetOrder.indexOf(targetId);
    
    if (fromIndex !== -1 && toIndex !== -1) {
      // Use moveWidgetUp/Down to reorder
      if (fromIndex < toIndex) {
        for (let i = fromIndex; i < toIndex; i++) {
          moveWidgetDown(draggedWidget);
        }
      } else {
        for (let i = fromIndex; i > toIndex; i--) {
          moveWidgetUp(draggedWidget);
        }
      }
    }
    
    setDraggedWidget(null);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Customize Layout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            Drag to reorder widgets or toggle visibility
          </p>
          
          <div className="space-y-2">
            {widgetOrder.map((widgetId, index) => {
              const widget = getWidgetInfo(widgetId);
              if (!widget) return null;
              
              const isVisible = widgetVisibility[widgetId] !== false;
              const isDragging = draggedWidget === widgetId;
              
              return (
                <div
                  key={widgetId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, widgetId)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, widgetId)}
                  className={`
                    flex items-center gap-3 p-3 bg-white border rounded-lg
                    transition-all cursor-move
                    ${isDragging ? 'opacity-50 border-blue-500' : 'border-gray-200 hover:border-gray-300'}
                    ${!isVisible ? 'opacity-60' : ''}
                  `}
                  data-testid={`widget-item-${widgetId}`}
                >
                  {/* Drag Handle */}
                  <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  {/* Widget Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {widget.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {widget.description}
                    </div>
                  </div>
                  
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveWidgetUp(widgetId)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveWidgetDown(widgetId)}
                      disabled={index === widgetOrder.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleWidgetVisibility(widgetId)}
                    className={`p-2 rounded-lg transition-colors ${
                      isVisible 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    aria-label={isVisible ? 'Hide widget' : 'Show widget'}
                    data-testid={`visibility-toggle-${widgetId}`}
                  >
                    {isVisible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          
          <Button
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="w-4 h-4" />
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// CUSTOMIZE BUTTON
// ============================================

/**
 * CustomizeLayoutButton Component
 * Button to open customization panel
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
export function CustomizeLayoutButton({ className = '' }) {
  const { setIsCustomizing } = useWidgetCustomization();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsCustomizing(true)}
      className={`flex items-center gap-2 ${className}`}
      data-testid="customize-layout-button"
    >
      <Settings className="w-4 h-4" />
      Customize
    </Button>
  );
}

// ============================================
// WIDGET RENDERER
// ============================================

/**
 * WidgetRenderer Component
 * Renders widgets based on customization settings
 * 
 * @param {Object} props
 * @param {Object} props.widgetComponents - Map of widget ID to component
 * @param {Object} props.widgetProps - Props to pass to each widget
 * @param {string} props.className - Additional CSS classes
 */
export function WidgetRenderer({ widgetComponents, widgetProps = {}, className = '' }) {
  const { getVisibleWidgets } = useWidgetCustomization();
  
  const visibleWidgets = getVisibleWidgets();
  
  return (
    <div className={className}>
      {visibleWidgets.map(widget => {
        const Component = widgetComponents[widget.id];
        if (!Component) return null;
        
        const props = widgetProps[widget.id] || {};
        
        return (
          <div key={widget.id} data-widget-id={widget.id}>
            <Component {...props} />
          </div>
        );
      })}
    </div>
  );
}

export default WidgetCustomizationProvider;
