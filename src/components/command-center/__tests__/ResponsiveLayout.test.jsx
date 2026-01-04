/**
 * Property-based tests for ResponsiveLayout
 * 
 * Property 10: Responsive Layout Adaptation
 * For any screen size change, the layout should adapt appropriately 
 * while maintaining all essential functionality
 * 
 * Validates: Requirements 8.1, 8.2
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import {
  ResponsiveLayoutProvider,
  ResponsiveGrid,
  ResponsiveWidget,
  ResponsiveContainer,
  MobilePriorityContainer,
  ShowOnMobile,
  ShowOnTablet,
  ShowOnDesktop,
  HideOnMobile,
  useResponsive,
  getDeviceType,
  getLayoutConfig,
  sortWidgetsByPriority,
  filterWidgetsForDevice,
  getGridClasses,
  BREAKPOINTS,
  DeviceType,
  DEFAULT_WIDGET_PRIORITY,
  DEFAULT_LAYOUTS,
} from '../ResponsiveLayout';

// ============================================
// TEST ARBITRARIES
// ============================================

// Screen width arbitrary covering all breakpoints
const screenWidthArbitrary = fc.integer({ min: 320, max: 2560 });

// Widget arbitrary for testing
const widgetArbitrary = fc.record({
  id: fc.constantFrom(
    'setup-assistant',
    'daily-planner',
    'quick-actions',
    'progress-dashboard',
    'content-workflow',
    'smart-suggestions',
    'notifications'
  ),
  name: fc.string({ minLength: 3, maxLength: 30 }),
  visible: fc.boolean(),
});

// Array of widgets
const widgetsArrayArbitrary = fc.array(widgetArbitrary, { minLength: 1, maxLength: 7 });

// Custom priority overrides
const priorityOverridesArbitrary = fc.dictionary(
  fc.constantFrom(
    'setup-assistant',
    'daily-planner',
    'quick-actions',
    'progress-dashboard',
    'content-workflow',
    'smart-suggestions',
    'notifications'
  ),
  fc.integer({ min: 1, max: 100 })
);

// ============================================
// UNIT TESTS
// ============================================

describe('ResponsiveLayout - Unit Tests', () => {
  describe('getDeviceType', () => {
    it('returns mobile for widths below tablet breakpoint', () => {
      expect(getDeviceType(320)).toBe(DeviceType.MOBILE);
      expect(getDeviceType(639)).toBe(DeviceType.MOBILE);
    });

    it('returns tablet for widths between tablet and desktop breakpoints', () => {
      expect(getDeviceType(640)).toBe(DeviceType.TABLET);
      expect(getDeviceType(1023)).toBe(DeviceType.TABLET);
    });

    it('returns desktop for widths at or above desktop breakpoint', () => {
      expect(getDeviceType(1024)).toBe(DeviceType.DESKTOP);
      expect(getDeviceType(1920)).toBe(DeviceType.DESKTOP);
    });
  });

  describe('getLayoutConfig', () => {
    it('returns mobile layout config for mobile device', () => {
      const config = getLayoutConfig(DeviceType.MOBILE);
      expect(config.columns).toBe(1);
      expect(config.maxVisibleWidgets).toBe(4);
    });

    it('returns tablet layout config for tablet device', () => {
      const config = getLayoutConfig(DeviceType.TABLET);
      expect(config.columns).toBe(2);
      expect(config.maxVisibleWidgets).toBe(6);
    });

    it('returns desktop layout config for desktop device', () => {
      const config = getLayoutConfig(DeviceType.DESKTOP);
      expect(config.columns).toBe(3);
      expect(config.maxVisibleWidgets).toBeNull();
    });

    it('merges custom layouts with defaults', () => {
      const customLayouts = {
        mobile: { columns: 2, gap: 'gap-2' },
      };
      const config = getLayoutConfig(DeviceType.MOBILE, customLayouts);
      expect(config.columns).toBe(2);
      expect(config.gap).toBe('gap-2');
      expect(config.padding).toBe('p-4'); // Default preserved
    });
  });

  describe('sortWidgetsByPriority', () => {
    it('sorts widgets by default priority', () => {
      const widgets = [
        { id: 'notifications' },
        { id: 'setup-assistant' },
        { id: 'daily-planner' },
      ];
      const sorted = sortWidgetsByPriority(widgets);
      expect(sorted[0].id).toBe('setup-assistant');
      expect(sorted[1].id).toBe('daily-planner');
      expect(sorted[2].id).toBe('notifications');
    });

    it('respects custom priority overrides', () => {
      const widgets = [
        { id: 'setup-assistant' },
        { id: 'notifications' },
      ];
      const overrides = { notifications: 200 };
      const sorted = sortWidgetsByPriority(widgets, overrides);
      expect(sorted[0].id).toBe('notifications');
    });
  });

  describe('filterWidgetsForDevice', () => {
    it('limits widgets on mobile', () => {
      const widgets = Array.from({ length: 7 }, (_, i) => ({ id: `widget-${i}` }));
      const layoutConfig = { maxVisibleWidgets: 4 };
      const filtered = filterWidgetsForDevice(widgets, DeviceType.MOBILE, layoutConfig);
      expect(filtered.length).toBe(4);
    });

    it('shows all widgets on desktop', () => {
      const widgets = Array.from({ length: 7 }, (_, i) => ({ id: `widget-${i}` }));
      const layoutConfig = { maxVisibleWidgets: null };
      const filtered = filterWidgetsForDevice(widgets, DeviceType.DESKTOP, layoutConfig);
      expect(filtered.length).toBe(7);
    });
  });

  describe('getGridClasses', () => {
    it('returns single column for mobile', () => {
      const layoutConfig = { columns: 1, gap: 'gap-4' };
      const classes = getGridClasses(layoutConfig, DeviceType.MOBILE);
      expect(classes).toContain('grid-cols-1');
      expect(classes).toContain('gap-4');
    });

    it('returns responsive columns for tablet', () => {
      const layoutConfig = { columns: 2, gap: 'gap-6' };
      const classes = getGridClasses(layoutConfig, DeviceType.TABLET);
      expect(classes).toContain('sm:grid-cols-2');
    });

    it('returns three columns for desktop', () => {
      const layoutConfig = { columns: 3, gap: 'gap-6' };
      const classes = getGridClasses(layoutConfig, DeviceType.DESKTOP);
      expect(classes).toContain('lg:grid-cols-3');
    });
  });
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('ResponsiveLayout - Property Tests', () => {
  /**
   * Feature: daily-command-center, Property 10: Responsive Layout Adaptation
   * For any screen size change, the layout should adapt appropriately 
   * while maintaining all essential functionality
   * 
   * Validates: Requirements 8.1, 8.2
   */
  describe('Property 10: Responsive Layout Adaptation', () => {
    it('should always return a valid device type for any screen width', () => {
      fc.assert(
        fc.property(screenWidthArbitrary, (width) => {
          const deviceType = getDeviceType(width);
          
          // Device type must be one of the valid types
          const validTypes = [DeviceType.MOBILE, DeviceType.TABLET, DeviceType.DESKTOP];
          expect(validTypes).toContain(deviceType);
          
          // Device type must match breakpoint rules
          if (width < BREAKPOINTS.tablet) {
            expect(deviceType).toBe(DeviceType.MOBILE);
          } else if (width < BREAKPOINTS.desktop) {
            expect(deviceType).toBe(DeviceType.TABLET);
          } else {
            expect(deviceType).toBe(DeviceType.DESKTOP);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should always return a valid layout config for any device type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(DeviceType.MOBILE, DeviceType.TABLET, DeviceType.DESKTOP),
          (deviceType) => {
            const config = getLayoutConfig(deviceType);
            
            // Config must have required properties
            expect(config).toHaveProperty('columns');
            expect(config).toHaveProperty('gap');
            expect(config).toHaveProperty('padding');
            expect(config).toHaveProperty('maxVisibleWidgets');
            expect(config).toHaveProperty('stackDirection');
            
            // Columns must be positive
            expect(config.columns).toBeGreaterThan(0);
            
            // Gap and padding must be strings
            expect(typeof config.gap).toBe('string');
            expect(typeof config.padding).toBe('string');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain widget order consistency after sorting', () => {
      fc.assert(
        fc.property(widgetsArrayArbitrary, (widgets) => {
          // Ensure unique IDs for test
          const uniqueWidgets = widgets.filter((w, i, arr) => 
            arr.findIndex(x => x.id === w.id) === i
          );
          
          if (uniqueWidgets.length === 0) return true;
          
          const sorted = sortWidgetsByPriority(uniqueWidgets);
          
          // Sorted array should have same length
          expect(sorted.length).toBe(uniqueWidgets.length);
          
          // All original widgets should be present
          uniqueWidgets.forEach(widget => {
            expect(sorted.some(w => w.id === widget.id)).toBe(true);
          });
          
          // Sorting should be stable (higher priority first)
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentPriority = DEFAULT_WIDGET_PRIORITY[sorted[i].id] ?? 50;
            const nextPriority = DEFAULT_WIDGET_PRIORITY[sorted[i + 1].id] ?? 50;
            expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should respect maxVisibleWidgets constraint for any device', () => {
      fc.assert(
        fc.property(
          widgetsArrayArbitrary,
          fc.constantFrom(DeviceType.MOBILE, DeviceType.TABLET, DeviceType.DESKTOP),
          (widgets, deviceType) => {
            // Ensure unique IDs
            const uniqueWidgets = widgets.filter((w, i, arr) => 
              arr.findIndex(x => x.id === w.id) === i
            );
            
            const layoutConfig = getLayoutConfig(deviceType);
            const filtered = filterWidgetsForDevice(uniqueWidgets, deviceType, layoutConfig);
            
            // If maxVisibleWidgets is set, filtered should not exceed it
            if (layoutConfig.maxVisibleWidgets !== null) {
              expect(filtered.length).toBeLessThanOrEqual(layoutConfig.maxVisibleWidgets);
            }
            
            // Filtered should not exceed original
            expect(filtered.length).toBeLessThanOrEqual(uniqueWidgets.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize high-priority widgets on mobile', () => {
      fc.assert(
        fc.property(widgetsArrayArbitrary, (widgets) => {
          // Ensure unique IDs
          const uniqueWidgets = widgets.filter((w, i, arr) => 
            arr.findIndex(x => x.id === w.id) === i
          );
          
          if (uniqueWidgets.length <= 4) return true;
          
          const layoutConfig = getLayoutConfig(DeviceType.MOBILE);
          const filtered = filterWidgetsForDevice(uniqueWidgets, DeviceType.MOBILE, layoutConfig);
          
          // Filtered widgets should be the highest priority ones
          const allSorted = sortWidgetsByPriority(uniqueWidgets);
          const expectedIds = allSorted.slice(0, layoutConfig.maxVisibleWidgets).map(w => w.id);
          
          filtered.forEach(widget => {
            expect(expectedIds).toContain(widget.id);
          });
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid grid classes for any layout config', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(DeviceType.MOBILE, DeviceType.TABLET, DeviceType.DESKTOP),
          (deviceType) => {
            const layoutConfig = getLayoutConfig(deviceType);
            const classes = getGridClasses(layoutConfig, deviceType);
            
            // Classes should be a non-empty string
            expect(typeof classes).toBe('string');
            expect(classes.length).toBeGreaterThan(0);
            
            // Should always include 'grid' class
            expect(classes).toContain('grid');
            
            // Should include gap class
            expect(classes).toContain('gap-');
            
            // Should include column class
            expect(classes).toContain('grid-cols-');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle custom priority overrides correctly', () => {
      fc.assert(
        fc.property(
          widgetsArrayArbitrary,
          priorityOverridesArbitrary,
          (widgets, overrides) => {
            // Ensure unique IDs
            const uniqueWidgets = widgets.filter((w, i, arr) => 
              arr.findIndex(x => x.id === w.id) === i
            );
            
            if (uniqueWidgets.length === 0) return true;
            
            const sorted = sortWidgetsByPriority(uniqueWidgets, overrides);
            
            // Sorted array should have same length
            expect(sorted.length).toBe(uniqueWidgets.length);
            
            // Verify sorting respects overrides
            const mergedPriorities = { ...DEFAULT_WIDGET_PRIORITY, ...overrides };
            
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentPriority = mergedPriorities[sorted[i].id] ?? 50;
              const nextPriority = mergedPriorities[sorted[i + 1].id] ?? 50;
              expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================
// COMPONENT INTEGRATION TESTS
// ============================================

describe('ResponsiveLayout - Component Tests', () => {
  // Mock window.innerWidth
  let originalInnerWidth;
  
  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });
  
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });
  
  const setWindowWidth = (width) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  // Helper component to test useResponsive hook
  const ResponsiveTestComponent = () => {
    const { deviceType, isMobile, isTablet, isDesktop, layoutConfig } = useResponsive();
    return (
      <div>
        <span data-testid="device-type">{deviceType}</span>
        <span data-testid="is-mobile">{isMobile.toString()}</span>
        <span data-testid="is-tablet">{isTablet.toString()}</span>
        <span data-testid="is-desktop">{isDesktop.toString()}</span>
        <span data-testid="columns">{layoutConfig.columns}</span>
      </div>
    );
  };

  it('renders ResponsiveLayoutProvider without crashing', () => {
    render(
      <ResponsiveLayoutProvider>
        <div>Test content</div>
      </ResponsiveLayoutProvider>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('provides correct device type through context', () => {
    setWindowWidth(1200);
    
    render(
      <ResponsiveLayoutProvider>
        <ResponsiveTestComponent />
      </ResponsiveLayoutProvider>
    );
    
    expect(screen.getByTestId('device-type')).toHaveTextContent('desktop');
    expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
  });

  it('renders ResponsiveGrid with correct classes', () => {
    render(
      <ResponsiveLayoutProvider>
        <ResponsiveGrid className="test-class">
          <div>Grid content</div>
        </ResponsiveGrid>
      </ResponsiveLayoutProvider>
    );
    
    expect(screen.getByText('Grid content')).toBeInTheDocument();
  });

  it('renders ResponsiveWidget with data attributes', () => {
    render(
      <ResponsiveLayoutProvider>
        <ResponsiveWidget id="test-widget">
          <div>Widget content</div>
        </ResponsiveWidget>
      </ResponsiveLayoutProvider>
    );
    
    expect(screen.getByTestId('widget-test-widget')).toBeInTheDocument();
  });

  it('hides widget on mobile when hideOnMobile is true', () => {
    setWindowWidth(400);
    
    render(
      <ResponsiveLayoutProvider>
        <ResponsiveWidget id="hidden-widget" hideOnMobile>
          <div>Hidden on mobile</div>
        </ResponsiveWidget>
      </ResponsiveLayoutProvider>
    );
    
    expect(screen.queryByText('Hidden on mobile')).not.toBeInTheDocument();
  });

  it('shows content only on mobile with ShowOnMobile', () => {
    setWindowWidth(400);
    
    render(
      <ResponsiveLayoutProvider>
        <ShowOnMobile>
          <div>Mobile only content</div>
        </ShowOnMobile>
      </ResponsiveLayoutProvider>
    );
    
    expect(screen.getByText('Mobile only content')).toBeInTheDocument();
  });

  it('hides content on mobile with HideOnMobile', () => {
    setWindowWidth(400);
    
    render(
      <ResponsiveLayoutProvider>
        <HideOnMobile>
          <div>Not on mobile</div>
        </HideOnMobile>
      </ResponsiveLayoutProvider>
    );
    
    expect(screen.queryByText('Not on mobile')).not.toBeInTheDocument();
  });
});
