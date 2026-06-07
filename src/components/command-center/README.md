# Daily Command Center

Centro de Comando Diário para o ViralCuts - Sistema focado em produtividade diária, configuração eficiente e criação de conteúdo orientada a resultados.

## Structure

```
command-center/
├── __tests__/              # Test files
│   ├── arbitraries.js      # Fast-check generators for property-based testing
│   ├── test-utils.js       # Test helper functions
│   └── setup.test.js       # Setup verification tests
├── DailyCommandCenter.jsx  # Main container component
├── SetupAssistant.jsx      # Initial setup and configuration guide
├── DailyPlanner.jsx        # Daily task planning and management
├── ProgressDashboard.jsx   # Metrics and progress tracking
├── ContentWorkflow.jsx     # Guided content creation workflow
├── QuickActions.jsx        # Contextual quick action buttons
├── SmartSuggestions.jsx    # Intelligent behavior-based suggestions
├── types.ts                # TypeScript type definitions
├── index.ts                # Barrel export
└── README.md               # This file
```

## Components

### DailyCommandCenter
Main container that orchestrates all child components and manages shared state.

### SetupAssistant
Guides new users through essential setup tasks with time estimates and benefits.

### DailyPlanner
Displays daily task recommendations based on user goals and schedule.

### ProgressDashboard
Shows real metrics: videos created, upload consistency, channel growth, and streaks.

### ContentWorkflow
Provides guided content creation process from idea to publication.

### QuickActions
Displays 4-6 contextual action buttons for common tasks.

### SmartSuggestions
Analyzes user behavior and provides intelligent recommendations.

## Testing

### Property-Based Testing
Uses fast-check for property-based testing with minimum 100 iterations per test.

Each property test references its design document property:
```javascript
// Feature: daily-command-center, Property 1: Setup task information completeness
```

### Test Utilities
- `arbitraries.js`: Fast-check generators for all command center types
- `test-utils.js`: Helper functions for creating mock data and testing components

### Running Tests
```bash
npm test                                    # Run all tests
npm test -- command-center                  # Run command center tests only
npm test:watch                              # Run tests in watch mode
npm test:coverage                           # Run tests with coverage
```

## Type Definitions

All TypeScript types are defined in `types.ts` and re-exported through:
- `src/components/command-center/index.ts`
- `src/types/command-center.ts`
- `src/types/index.ts`

## Requirements

See `.kiro/specs/daily-command-center/requirements.md` for detailed requirements.

## Design

See `.kiro/specs/daily-command-center/design.md` for architecture and design decisions.

## Implementation Plan

See `.kiro/specs/daily-command-center/tasks.md` for the complete implementation task list.
