/**
 * ResponsiveLayout Component
 * Provides responsive layout system for Daily Command Center
 * 
 * Requirements: 8.1, 8.2, 8.4
 * - Adapt layout based on screen size (mobile, tablet, desktop)
 * - Prioritize most important information on mobile
 * - Maintain consistent design language with current theme
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';

// ============================================
// BREAKPOINT DEFINITIONS
// ============================================

/**
 * Breakpoint definitions matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  mobile: 0,      // 0-639px
  tablet: 640,    // 640-1023px (sm)
  desktop: 1024,  // 1024px+ (lg)
};

/**
 * Device type enum
 */
export const DeviceType = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
};

// ============================================
// LAYOUT CONFIGURATION
// ============================================

/**
 * Default widget priority for mobile content prioritization
 * Higher number = higher priority (shown first on mobile)
 * Requirements: 8.2 - Prioritize most important information on mobile
 */
export const DEFAULT_WIDGET_PRIORITY = {
  'setup-assistant': 100,      // Highest priority - essential for new users
  'daily-planner': 95,         // High priority - daily tasks
  'quick-actions': 90,         // High priority - common actions
  'progress-dashboard': 85,    // Important metrics
  'content-workflow': 80,      // Content creation
  'smart-suggestions': 75,     // Suggestions
  'notifications': 70,         // Notifications
};

/**
 * Default layout configurations per device type
 */
export const DEFAULT_LAYOUTS = {
  mobile: {
    columns: 1,
    gap: 'gap-4',
    padding: 'p-4',
    maxVisibleWidgets: 4,  // Show only top 4 widgets on mobile
    stackDirection: 'vertical',
  },
  tablet: {
    columns: 2,
    gap: 'gap-5',
    padding: 'p-5',
    maxVisibleWidgets: 6,
    stackDirection: 'vertical',
  },
  desktop: {
    columns: 2,
    gap: 'gap-5',
    padding: 'p-6',
    maxVisibleWidgets: null, // Show all widgets
    stackDirection: 'horizontal',
  },
};

// ============================================
// RESPONSIVE CONTEXT
// ============================================

const ResponsiveContext = createContext(null);

/**
 * Hook to access responsive context
 * @returns {ResponsiveContextValue}
 */
export function useResponsive() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveLayoutProvider');
  }
  return context;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current device type based on window width
 * @param {number} width - Window width in pixels
 * @returns {string} Device type
 */
export function getDeviceType(width) {
  if (width >= BREAKPOINTS.desktop) return DeviceType.DESKTOP;
  if (width >= BREAKPOINTS.tablet) return DeviceType.TABLET;
  return DeviceType.MOBILE;
}

/**
 * Get layout configuration for device type
 * @param {string} deviceType - Device type
 * @param {Object} customLayouts - Custom layout overrides
 * @returns {Object} Layout configuration
 */
export function getLayoutConfig(deviceType, customLayouts = {}) {
  const defaultLayout = DEFAULT_LAYOUTS[deviceType] || DEFAULT_LAYOUTS.desktop;
  const customLayout = customLayouts[deviceType] || {};
  return { ...defaultLayout, ...customLayout };
}

/**
 * Sort widgets by priority for mobile display
 * Requirements: 8.2 - Prioritize most important information on mobile
 * @param {Array} widgets - Array of widget configurations
 * @param {Object} priorityOverrides - Custom priority overrides
 * @returns {Array} Sorted widgets
 */
export function sortWidgetsByPriority(widgets, priorityOverrides = {}) {
  const priorities = { ...DEFAULT_WIDGET_PRIORITY, ...priorityOverrides };
  
  return [...widgets].sort((a, b) => {
    const priorityA = priorities[a.id] ?? 50;
    const priorityB = priorities[b.id] ?? 50;
    return priorityB - priorityA;
  });
}

/**
 * Filter widgets based on device visibility limits
 * @param {Array} widgets - Array of widgets
 * @param {string} deviceType - Current device type
 * @param {Object} layoutConfig - Layout configuration
 * @returns {Array} Filtered widgets
 */
export function filterWidgetsForDevice(widgets, deviceType, layoutConfig) {
  const { maxVisibleWidgets } = layoutConfig;
  
  if (maxVisibleWidgets === null) {
    return widgets;
  }
  
  // Sort by priority first, then limit
  const sorted = sortWidgetsByPriority(widgets);
  return sorted.slice(0, maxVisibleWidgets);
}

/**
 * Generate responsive grid classes
 * @param {Object} layoutConfig - Layout configuration
 * @param {string} deviceType - Current device type
 * @returns {string} Tailwind CSS classes
 */
export function getGridClasses(layoutConfig, deviceType) {
  const { gap } = layoutConfig;
  
  // Base grid classes
  const baseClasses = ['grid', gap];
  
  // Column classes based on device - using 2 columns for better card width
  switch (deviceType) {
    case DeviceType.MOBILE:
      baseClasses.push('grid-cols-1');
      break;
    case DeviceType.TABLET:
      baseClasses.push('grid-cols-1 sm:grid-cols-2');
      break;
    case DeviceType.DESKTOP:
      baseClasses.push('grid-cols-1 md:grid-cols-2');
      break;
    default:
      baseClasses.push('grid-cols-1');
  }
  
  return baseClasses.join(' ');
}

// ============================================
// RESPONSIVE LAYOUT PROVIDER
// ============================================

/**
 * ResponsiveLayoutProvider Component
 * Provides responsive context to child components
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.customLayouts - Custom layout configurations
 * @param {Object} props.widgetPriorities - Custom widget priorities
 */
export function ResponsiveLayoutProvider({ 
  children, 
  customLayouts = {},
  widgetPriorities = {},
}) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
  );
  
  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let timeoutId;
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Compute derived values
  const deviceType = useMemo(() => getDeviceType(windowWidth), [windowWidth]);
  const layoutConfig = useMemo(
    () => getLayoutConfig(deviceType, customLayouts),
    [deviceType, customLayouts]
  );
  
  // Context value
  const contextValue = useMemo(() => ({
    windowWidth,
    deviceType,
    layoutConfig,
    isMobile: deviceType === DeviceType.MOBILE,
    isTablet: deviceType === DeviceType.TABLET,
    isDesktop: deviceType === DeviceType.DESKTOP,
    widgetPriorities: { ...DEFAULT_WIDGET_PRIORITY, ...widgetPriorities },
    getGridClasses: () => getGridClasses(layoutConfig, deviceType),
    sortWidgets: (widgets) => sortWidgetsByPriority(widgets, widgetPriorities),
    filterWidgets: (widgets) => filterWidgetsForDevice(widgets, deviceType, layoutConfig),
  }), [windowWidth, deviceType, layoutConfig, widgetPriorities]);
  
  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
}

// ============================================
// RESPONSIVE GRID COMPONENT
// ============================================

/**
 * ResponsiveGrid Component
 * Renders children in a responsive grid layout
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 */
export function ResponsiveGrid({ children, className = '' }) {
  const { getGridClasses } = useResponsive();
  
  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
}

// ============================================
// RESPONSIVE WIDGET WRAPPER
// ============================================

/**
 * ResponsiveWidget Component
 * Wraps individual widgets with responsive behavior
 * 
 * @param {Object} props
 * @param {string} props.id - Widget identifier
 * @param {React.ReactNode} props.children - Widget content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullWidth - Whether widget spans full width
 * @param {boolean} props.hideOnMobile - Whether to hide on mobile
 * @param {boolean} props.hideOnTablet - Whether to hide on tablet
 * @param {boolean} props.hideOnDesktop - Whether to hide on desktop
 */
export function ResponsiveWidget({ 
  id,
  children, 
  className = '',
  fullWidth = false,
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
}) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Check visibility based on device
  if (hideOnMobile && isMobile) return null;
  if (hideOnTablet && isTablet) return null;
  if (hideOnDesktop && isDesktop) return null;
  
  // Full width class for spanning columns
  const widthClass = fullWidth ? 'col-span-full' : '';
  
  return (
    <div 
      className={`responsive-widget ${widthClass} ${className}`}
      data-widget-id={id}
      data-testid={`widget-${id}`}
    >
      {children}
    </div>
  );
}

// ============================================
// MOBILE PRIORITY CONTAINER
// ============================================

/**
 * MobilePriorityContainer Component
 * Renders widgets sorted by priority on mobile devices
 * Requirements: 8.2 - Prioritize most important information on mobile
 * 
 * @param {Object} props
 * @param {Array} props.widgets - Array of widget configurations
 * @param {Function} props.renderWidget - Function to render each widget
 * @param {string} props.className - Additional CSS classes
 */
export function MobilePriorityContainer({ 
  widgets, 
  renderWidget, 
  className = '' 
}) {
  const { isMobile, sortWidgets, filterWidgets } = useResponsive();
  
  // Sort and filter widgets based on device
  const processedWidgets = useMemo(() => {
    const sorted = sortWidgets(widgets);
    return isMobile ? filterWidgets(sorted) : sorted;
  }, [widgets, isMobile, sortWidgets, filterWidgets]);
  
  return (
    <div className={className}>
      {processedWidgets.map((widget, index) => (
        <React.Fragment key={widget.id}>
          {renderWidget(widget, index)}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================
// SHOW/HIDE COMPONENTS
// ============================================

/**
 * ShowOnMobile - Only renders children on mobile devices
 */
export function ShowOnMobile({ children }) {
  const { isMobile } = useResponsive();
  return isMobile ? <>{children}</> : null;
}

/**
 * ShowOnTablet - Only renders children on tablet devices
 */
export function ShowOnTablet({ children }) {
  const { isTablet } = useResponsive();
  return isTablet ? <>{children}</> : null;
}

/**
 * ShowOnDesktop - Only renders children on desktop devices
 */
export function ShowOnDesktop({ children }) {
  const { isDesktop } = useResponsive();
  return isDesktop ? <>{children}</> : null;
}

/**
 * HideOnMobile - Hides children on mobile devices
 */
export function HideOnMobile({ children }) {
  const { isMobile } = useResponsive();
  return isMobile ? null : <>{children}</>;
}

/**
 * HideOnTablet - Hides children on tablet devices
 */
export function HideOnTablet({ children }) {
  const { isTablet } = useResponsive();
  return isTablet ? null : <>{children}</>;
}

/**
 * HideOnDesktop - Hides children on desktop devices
 */
export function HideOnDesktop({ children }) {
  const { isDesktop } = useResponsive();
  return isDesktop ? null : <>{children}</>;
}

// ============================================
// RESPONSIVE CONTAINER
// ============================================

/**
 * ResponsiveContainer Component
 * Main container with responsive padding and max-width
 * Requirements: 8.4 - Maintain consistent design language
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 */
export function ResponsiveContainer({ children, className = '' }) {
  const { layoutConfig, deviceType } = useResponsive();
  
  // Responsive max-width classes
  const maxWidthClass = deviceType === DeviceType.DESKTOP 
    ? 'max-w-7xl mx-auto' 
    : 'max-w-full';
  
  return (
    <div className={`responsive-container ${layoutConfig.padding} ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
}

export default ResponsiveLayoutProvider;
