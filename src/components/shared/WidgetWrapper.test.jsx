/**
 * WidgetWrapper Component Tests
 * Tests for widget wrapper visual consistency
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WidgetWrapper from './WidgetWrapper';

describe('WidgetWrapper Component', () => {
  it('should render with title', () => {
    render(
      <WidgetWrapper title="Test Widget">
        <div>Content</div>
      </WidgetWrapper>
    );
    
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">📊</span>;
    
    render(
      <WidgetWrapper title="Test Widget" icon={<TestIcon />}>
        <div>Content</div>
      </WidgetWrapper>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should render with actions', () => {
    render(
      <WidgetWrapper 
        title="Test Widget"
        actions={<button>Action</button>}
      >
        <div>Content</div>
      </WidgetWrapper>
    );
    
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should apply consistent border-radius class (rounded-2xl)', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget">
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('rounded-2xl');
  });

  it('should apply responsive padding classes', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget">
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('p-4');
    expect(wrapper).toHaveClass('md:p-6');
  });

  it('should apply animation classes (animate-in fade-in)', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget">
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('animate-in');
    expect(wrapper).toHaveClass('fade-in');
  });

  it('should render skeleton loading state when loading is true', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget" loading={true}>
        <div>Content</div>
      </WidgetWrapper>
    );
    
    // Should have animate-pulse for skeleton
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Content should not be rendered during loading
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should render skeleton with actions placeholder when actions prop exists', () => {
    const { container } = render(
      <WidgetWrapper 
        title="Test Widget" 
        loading={true}
        actions={<button>Action</button>}
      >
        <div>Content</div>
      </WidgetWrapper>
    );
    
    // Should have skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget" className="custom-class">
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should apply fullWidth class when fullWidth is true', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget" fullWidth={true}>
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('w-full');
  });

  it('should render header with icon on left and actions on right', () => {
    const TestIcon = () => <span data-testid="test-icon">📊</span>;
    
    const { container } = render(
      <WidgetWrapper 
        title="Test Widget"
        icon={<TestIcon />}
        actions={<button data-testid="action-button">Action</button>}
      >
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const header = container.querySelector('.flex.items-center.justify-between');
    expect(header).toBeInTheDocument();
    
    // Icon should be in the left section
    const leftSection = screen.getByTestId('test-icon').closest('.flex.items-center');
    expect(leftSection).toContainElement(screen.getByTestId('test-icon'));
    
    // Actions should be in the right section
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <WidgetWrapper title="Test Widget">
        <div data-testid="child-content">
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </div>
      </WidgetWrapper>
    );
    
    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeInTheDocument();
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });

  it('should apply background and border styles', () => {
    const { container } = render(
      <WidgetWrapper title="Test Widget">
        <div>Content</div>
      </WidgetWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-slate-900/80');
    expect(wrapper).toHaveClass('border');
    expect(wrapper).toHaveClass('border-slate-800');
  });
});
