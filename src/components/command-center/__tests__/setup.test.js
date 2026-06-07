/**
 * Setup verification tests
 * Ensures testing framework and fast-check are properly configured
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deepEqual } from './test-utils';
import {
  setupTaskArbitrary,
  taskArbitrary,
  userMetricsArbitrary,
  workflowStateArbitrary,
} from './arbitraries';

describe('Testing Framework Setup', () => {
  it('should have vitest configured', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check available', () => {
    expect(fc).toBeDefined();
    expect(fc.assert).toBeDefined();
    expect(fc.property).toBeDefined();
  });

  it('should generate valid setup tasks', () => {
    fc.assert(
      fc.property(setupTaskArbitrary, (task) => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('estimatedTime');
        expect(task.estimatedTime).toBeGreaterThan(0);
        expect(task.benefits).toBeInstanceOf(Array);
        expect(task.benefits.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should generate valid tasks', () => {
    fc.assert(
      fc.property(taskArbitrary, (task) => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('type');
        expect(['creation', 'optimization', 'analysis', 'planning']).toContain(task.type);
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should generate valid user metrics', () => {
    fc.assert(
      fc.property(userMetricsArbitrary, (metrics) => {
        expect(metrics).toHaveProperty('videosCreatedThisWeek');
        expect(metrics).toHaveProperty('uploadConsistency');
        expect(metrics).toHaveProperty('channelGrowth');
        expect(metrics).toHaveProperty('streaks');
        expect(metrics.uploadConsistency).toBeGreaterThanOrEqual(0);
        expect(metrics.uploadConsistency).toBeLessThanOrEqual(100);
        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should generate valid workflow states', () => {
    fc.assert(
      fc.property(workflowStateArbitrary, (workflow) => {
        expect(workflow).toHaveProperty('id');
        expect(workflow).toHaveProperty('contentType');
        expect(workflow).toHaveProperty('steps');
        expect(workflow.steps).toBeInstanceOf(Array);
        expect(workflow.steps.length).toBeGreaterThan(0);
        expect(workflow.progress).toBeGreaterThanOrEqual(0);
        expect(workflow.progress).toBeLessThanOrEqual(100);
        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should have deepEqual utility working', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    const obj3 = { a: 1, b: { c: 3 } };

    expect(deepEqual(obj1, obj2)).toBe(true);
    expect(deepEqual(obj1, obj3)).toBe(false);
  });

  it('should handle date comparison in deepEqual', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-01');
    const date3 = new Date('2024-01-02');

    expect(deepEqual(date1, date2)).toBe(true);
    expect(deepEqual(date1, date3)).toBe(false);
  });
});
