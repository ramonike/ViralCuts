import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  WidgetCustomizationProvider,
  WidgetCustomizationPanel,
  CustomizeLayoutButton,
  WidgetRenderer,
  useWidgetCustomization,
  DEFAULT_WIDGETS,
} from '../WidgetCustomization';

/**
 * Unit tests for WidgetCustomization component
 * 
 * Tests widget reordering, visibility toggles, and layout preference persistence
 * 
 * Requirements: 8.3, 8.5
 * - Allow users to customize widget order and visibility
 * - Remember user layout preferences and restore them on subsequent visits
 */

// Helper component to access and test context values
function ContextTestComponent({ onContextReady }) {
  const context = useWidgetCustomization();
  React.useEffect(() => {
    if (onContextReady) {
      onContextReady(context);
    }
  }, [context, onContextReady]);
  
  return (
    <div>
      <span data-testid="widget-order">{JSON.stringify(context.widgetOrder)}</span>
      <span data-testid="widget-visibility">{JSON.stringify(context.widgetVisibility)}</span>
      <span data-testid="is-customizing">{context.isCustomizing.toString()}</span>
    </div>
  );
}

// Mock widget components for testing WidgetRenderer
function MockWidget({ id }) {
  return <div data-testid={`mock-widget-${id}`}>Widget: {id}</div>;
}

describe('WidgetCustomization - Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('WidgetCustomizationProvider', () => {
    it('initializes with default widget order', () => {
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      const orderElement = screen.getByTestId('widget-order');
      const order = JSON.parse(orderElement.textContent);
      
      expect(order).toHaveLength(DEFAULT_WIDGETS.length);
      expect(order[0]).toBe('setup-assistant');
    });

    it('initializes with default widget visibility', () => {
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      const visibilityElement = screen.getByTestId('widget-visibility');
      const visibility = JSON.parse(visibilityElement.textContent);
      
      DEFAULT_WIDGETS.forEach(widget => {
        expect(visibility[widget.id]).toBe(true);
      });
    });

    it('loads widget order from localStorage if available', () => {
      const customOrder = ['notifications', 'quick-actions', 'daily-planner'];
      localStorage.setItem('command-center-widget-order', JSON.stringify(customOrder));

      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      const orderElement = screen.getByTestId('widget-order');
      const order = JSON.parse(orderElement.textContent);
      
      expect(order).toEqual(customOrder);
    });

    it('loads widget visibility from localStorage if available', () => {
      const customVisibility = {
        'setup-assistant': false,
        'daily-planner': true,
        'quick-actions': false,
      };
      localStorage.setItem('command-center-widget-visibility', JSON.stringify(customVisibility));

      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      const visibilityElement = screen.getByTestId('widget-visibility');
      const visibility = JSON.parse(visibilityElement.textContent);
      
      expect(visibility['setup-assistant']).toBe(false);
      expect(visibility['daily-planner']).toBe(true);
      expect(visibility['quick-actions']).toBe(false);
    });
  });

  describe('Widget Reordering', () => {
    it('moves widget up in order', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const initialOrder = [...contextRef.widgetOrder];
      const secondWidget = initialOrder[1];

      contextRef.moveWidgetUp(secondWidget);

      await waitFor(() => {
        const orderElement = screen.getByTestId('widget-order');
        const newOrder = JSON.parse(orderElement.textContent);
        expect(newOrder[0]).toBe(secondWidget);
      });
    });

    it('moves widget down in order', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const initialOrder = [...contextRef.widgetOrder];
      const firstWidget = initialOrder[0];

      contextRef.moveWidgetDown(firstWidget);

      await waitFor(() => {
        const orderElement = screen.getByTestId('widget-order');
        const newOrder = JSON.parse(orderElement.textContent);
        expect(newOrder[1]).toBe(firstWidget);
      });
    });

    it('does not move first widget up', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const initialOrder = [...contextRef.widgetOrder];
      const firstWidget = initialOrder[0];

      contextRef.moveWidgetUp(firstWidget);

      await waitFor(() => {
        const orderElement = screen.getByTestId('widget-order');
        const newOrder = JSON.parse(orderElement.textContent);
        expect(newOrder[0]).toBe(firstWidget);
      });
    });

    it('does not move last widget down', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const initialOrder = [...contextRef.widgetOrder];
      const lastWidget = initialOrder[initialOrder.length - 1];

      contextRef.moveWidgetDown(lastWidget);

      await waitFor(() => {
        const orderElement = screen.getByTestId('widget-order');
        const newOrder = JSON.parse(orderElement.textContent);
        expect(newOrder[newOrder.length - 1]).toBe(lastWidget);
      });
    });

    it('reorders widgets using reorderWidgets function', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const initialOrder = [...contextRef.widgetOrder];
      
      contextRef.reorderWidgets(0, 2);

      await waitFor(() => {
        const orderElement = screen.getByTestId('widget-order');
        const newOrder = JSON.parse(orderElement.textContent);
        expect(newOrder[2]).toBe(initialOrder[0]);
      });
    });
  });
  describe('Widget Visibility Toggles', () => {
    it('toggles widget visibility', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const widgetId = 'setup-assistant';
      const initialVisibility = contextRef.widgetVisibility[widgetId];

      contextRef.toggleWidgetVisibility(widgetId);

      await waitFor(() => {
        const visibilityElement = screen.getByTestId('widget-visibility');
        const visibility = JSON.parse(visibilityElement.textContent);
        expect(visibility[widgetId]).toBe(!initialVisibility);
      });
    });

    it('sets widget visibility explicitly', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const widgetId = 'daily-planner';

      contextRef.setWidgetVisible(widgetId, false);

      await waitFor(() => {
        const visibilityElement = screen.getByTestId('widget-visibility');
        const visibility = JSON.parse(visibilityElement.textContent);
        expect(visibility[widgetId]).toBe(false);
      });

      contextRef.setWidgetVisible(widgetId, true);

      await waitFor(() => {
        const visibilityElement = screen.getByTestId('widget-visibility');
        const visibility = JSON.parse(visibilityElement.textContent);
        expect(visibility[widgetId]).toBe(true);
      });
    });

    it('checks widget visibility with isWidgetVisible', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      expect(contextRef.isWidgetVisible('setup-assistant')).toBe(true);

      contextRef.toggleWidgetVisibility('setup-assistant');

      await waitFor(() => {
        expect(contextRef.isWidgetVisible('setup-assistant')).toBe(false);
      });
    });
  });

  describe('Layout Preference Persistence', () => {
    it('persists widget order to localStorage', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const secondWidget = contextRef.widgetOrder[1];
      contextRef.moveWidgetUp(secondWidget);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'command-center-widget-order',
          expect.any(String)
        );
      });
    });

    it('persists widget visibility to localStorage', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      contextRef.toggleWidgetVisibility('setup-assistant');

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'command-center-widget-visibility',
          expect.any(String)
        );
      });
    });

    it('restores preferences on subsequent visits', () => {
      const savedOrder = ['notifications', 'quick-actions', 'setup-assistant'];
      const savedVisibility = { 'setup-assistant': false, 'notifications': true };
      
      localStorage.setItem('command-center-widget-order', JSON.stringify(savedOrder));
      localStorage.setItem('command-center-widget-visibility', JSON.stringify(savedVisibility));

      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      const orderElement = screen.getByTestId('widget-order');
      const visibilityElement = screen.getByTestId('widget-visibility');
      
      expect(JSON.parse(orderElement.textContent)).toEqual(savedOrder);
      expect(JSON.parse(visibilityElement.textContent)['setup-assistant']).toBe(false);
    });
  });

  describe('Reset to Defaults', () => {
    it('resets widget order to defaults', async () => {
      let contextRef;
      
      const customOrder = ['notifications', 'quick-actions'];
      localStorage.setItem('command-center-widget-order', JSON.stringify(customOrder));

      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      contextRef.resetToDefaults();

      await waitFor(() => {
        const orderElement = screen.getByTestId('widget-order');
        const order = JSON.parse(orderElement.textContent);
        expect(order[0]).toBe('setup-assistant');
        expect(order).toHaveLength(DEFAULT_WIDGETS.length);
      });
    });

    it('resets widget visibility to defaults', async () => {
      let contextRef;
      
      const customVisibility = { 'setup-assistant': false, 'daily-planner': false };
      localStorage.setItem('command-center-widget-visibility', JSON.stringify(customVisibility));

      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      contextRef.resetToDefaults();

      await waitFor(() => {
        const visibilityElement = screen.getByTestId('widget-visibility');
        const visibility = JSON.parse(visibilityElement.textContent);
        expect(visibility['setup-assistant']).toBe(true);
        expect(visibility['daily-planner']).toBe(true);
      });
    });
  });

  describe('getOrderedWidgets and getVisibleWidgets', () => {
    it('returns widgets in correct order', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      const orderedWidgets = contextRef.getOrderedWidgets();
      
      expect(orderedWidgets[0].id).toBe('setup-assistant');
      expect(orderedWidgets).toHaveLength(DEFAULT_WIDGETS.length);
    });

    it('returns only visible widgets', async () => {
      let contextRef;
      
      render(
        <WidgetCustomizationProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      contextRef.toggleWidgetVisibility('setup-assistant');
      contextRef.toggleWidgetVisibility('notifications');

      await waitFor(() => {
        const visibleWidgets = contextRef.getVisibleWidgets();
        const visibleIds = visibleWidgets.map(w => w.id);
        
        expect(visibleIds).not.toContain('setup-assistant');
        expect(visibleIds).not.toContain('notifications');
        expect(visibleWidgets.length).toBe(DEFAULT_WIDGETS.length - 2);
      });
    });
  });

  describe('onLayoutChange callback', () => {
    it('calls onLayoutChange when order changes', async () => {
      const onLayoutChange = vi.fn();
      let contextRef;
      
      render(
        <WidgetCustomizationProvider onLayoutChange={onLayoutChange}>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      onLayoutChange.mockClear();

      contextRef.moveWidgetUp(contextRef.widgetOrder[1]);

      await waitFor(() => {
        expect(onLayoutChange).toHaveBeenCalledWith(
          expect.objectContaining({
            widgetOrder: expect.any(Array),
            widgetVisibility: expect.any(Object),
          })
        );
      });
    });

    it('calls onLayoutChange when visibility changes', async () => {
      const onLayoutChange = vi.fn();
      let contextRef;
      
      render(
        <WidgetCustomizationProvider onLayoutChange={onLayoutChange}>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </WidgetCustomizationProvider>
      );

      await waitFor(() => expect(contextRef).toBeDefined());

      onLayoutChange.mockClear();

      contextRef.toggleWidgetVisibility('setup-assistant');

      await waitFor(() => {
        expect(onLayoutChange).toHaveBeenCalled();
      });
    });
  });
});
describe('WidgetCustomization - Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('WidgetCustomizationPanel', () => {
    it('renders when isOpen is true', () => {
      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={true} onClose={() => {}} />
        </WidgetCustomizationProvider>
      );

      expect(screen.getByText('Customize Layout')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={false} onClose={() => {}} />
        </WidgetCustomizationProvider>
      );

      expect(screen.queryByText('Customize Layout')).not.toBeInTheDocument();
    });

    it('displays all widgets in the panel', () => {
      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={true} onClose={() => {}} />
        </WidgetCustomizationProvider>
      );

      DEFAULT_WIDGETS.forEach(widget => {
        expect(screen.getByText(widget.name)).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      
      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={true} onClose={onClose} />
        </WidgetCustomizationProvider>
      );

      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Done button is clicked', () => {
      const onClose = vi.fn();
      
      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={true} onClose={onClose} />
        </WidgetCustomizationProvider>
      );

      fireEvent.click(screen.getByText('Done'));
      expect(onClose).toHaveBeenCalled();
    });

    it('toggles visibility when visibility button is clicked', async () => {
      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={true} onClose={() => {}} />
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      const visibilityToggle = screen.getByTestId('visibility-toggle-setup-assistant');
      fireEvent.click(visibilityToggle);

      await waitFor(() => {
        const visibilityElement = screen.getByTestId('widget-visibility');
        const visibility = JSON.parse(visibilityElement.textContent);
        expect(visibility['setup-assistant']).toBe(false);
      });
    });

    it('resets to defaults when Reset button is clicked', async () => {
      const customVisibility = { 'setup-assistant': false };
      localStorage.setItem('command-center-widget-visibility', JSON.stringify(customVisibility));

      render(
        <WidgetCustomizationProvider>
          <WidgetCustomizationPanel isOpen={true} onClose={() => {}} />
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      fireEvent.click(screen.getByText('Reset to Default'));

      await waitFor(() => {
        const visibilityElement = screen.getByTestId('widget-visibility');
        const visibility = JSON.parse(visibilityElement.textContent);
        expect(visibility['setup-assistant']).toBe(true);
      });
    });
  });

  describe('CustomizeLayoutButton', () => {
    it('renders the customize button', () => {
      render(
        <WidgetCustomizationProvider>
          <CustomizeLayoutButton />
        </WidgetCustomizationProvider>
      );

      expect(screen.getByTestId('customize-layout-button')).toBeInTheDocument();
      expect(screen.getByText('Customize')).toBeInTheDocument();
    });

    it('sets isCustomizing to true when clicked', async () => {
      render(
        <WidgetCustomizationProvider>
          <CustomizeLayoutButton />
          <ContextTestComponent />
        </WidgetCustomizationProvider>
      );

      fireEvent.click(screen.getByTestId('customize-layout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('is-customizing')).toHaveTextContent('true');
      });
    });
  });

  describe('WidgetRenderer', () => {
    it('renders visible widgets in order', () => {
      const widgetComponents = {
        'setup-assistant': () => <MockWidget id="setup-assistant" />,
        'daily-planner': () => <MockWidget id="daily-planner" />,
        'quick-actions': () => <MockWidget id="quick-actions" />,
      };

      render(
        <WidgetCustomizationProvider>
          <WidgetRenderer widgetComponents={widgetComponents} />
        </WidgetCustomizationProvider>
      );

      expect(screen.getByTestId('mock-widget-setup-assistant')).toBeInTheDocument();
      expect(screen.getByTestId('mock-widget-daily-planner')).toBeInTheDocument();
      expect(screen.getByTestId('mock-widget-quick-actions')).toBeInTheDocument();
    });

    it('does not render hidden widgets', () => {
      const widgetComponents = {
        'setup-assistant': () => <MockWidget id="setup-assistant" />,
        'daily-planner': () => <MockWidget id="daily-planner" />,
      };

      const customVisibility = { 'setup-assistant': false, 'daily-planner': true };
      localStorage.setItem('command-center-widget-visibility', JSON.stringify(customVisibility));

      render(
        <WidgetCustomizationProvider>
          <WidgetRenderer widgetComponents={widgetComponents} />
        </WidgetCustomizationProvider>
      );

      expect(screen.queryByTestId('mock-widget-setup-assistant')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-widget-daily-planner')).toBeInTheDocument();
    });

    it('passes props to widget components', () => {
      const widgetComponents = {
        'setup-assistant': ({ testProp }) => (
          <div data-testid="widget-with-prop">{testProp}</div>
        ),
      };

      const widgetProps = {
        'setup-assistant': { testProp: 'test-value' },
      };

      render(
        <WidgetCustomizationProvider>
          <WidgetRenderer widgetComponents={widgetComponents} widgetProps={widgetProps} />
        </WidgetCustomizationProvider>
      );

      expect(screen.getByTestId('widget-with-prop')).toHaveTextContent('test-value');
    });
  });
});

describe('WidgetCustomization - Error Handling', () => {
  it('throws error when useWidgetCustomization is used outside provider', () => {
    function TestComponent() {
      useWidgetCustomization();
      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      'useWidgetCustomization must be used within WidgetCustomizationProvider'
    );
  });
});