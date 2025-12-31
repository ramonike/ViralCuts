/**
 * PlatformSelector Component Tests
 * Tests for multi-platform selection UI
 * Requirements: 3.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlatformSelector } from './PlatformSelector';

describe('PlatformSelector', () => {
    const mockOnSelectionChange = vi.fn();

    const defaultAvailablePlatforms = [
        { id: 'youtube', connected: true, accountName: 'My Channel' },
        { id: 'tiktok', connected: true, accountName: '@myaccount' },
        { id: 'instagram', connected: false },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all platforms', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            expect(screen.getByText('YouTube')).toBeInTheDocument();
            expect(screen.getByText('TikTok')).toBeInTheDocument();
            expect(screen.getByText('Instagram')).toBeInTheDocument();
        });

        it('should show connection status for each platform', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                    showConnectionStatus={true}
                />
            );

            expect(screen.getByText('My Channel')).toBeInTheDocument();
            expect(screen.getByText('@myaccount')).toBeInTheDocument();
            expect(screen.getByText('Não conectado')).toBeInTheDocument();
        });

        it('should show selection count', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={['youtube']}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            expect(screen.getByText('1 de 2 selecionadas')).toBeInTheDocument();
        });
    });

    describe('Selection', () => {
        it('should call onSelectionChange when platform is selected', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            const youtubeButton = screen.getByText('YouTube').closest('button');
            fireEvent.click(youtubeButton);

            expect(mockOnSelectionChange).toHaveBeenCalledWith(['youtube']);
        });

        it('should call onSelectionChange when platform is deselected', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={['youtube', 'tiktok']}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            const youtubeButton = screen.getByText('YouTube').closest('button');
            fireEvent.click(youtubeButton);

            expect(mockOnSelectionChange).toHaveBeenCalledWith(['tiktok']);
        });

        it('should not allow selection of disconnected platforms', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            const instagramButton = screen.getByText('Instagram').closest('button');
            fireEvent.click(instagramButton);

            expect(mockOnSelectionChange).not.toHaveBeenCalled();
        });
    });

    describe('Disabled state', () => {
        it('should not allow selection when disabled', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                    disabled={true}
                />
            );

            const youtubeButton = screen.getByText('YouTube').closest('button');
            fireEvent.click(youtubeButton);

            expect(mockOnSelectionChange).not.toHaveBeenCalled();
        });
    });

    describe('Warnings', () => {
        it('should show warning when no platforms are connected', () => {
            render(
                <PlatformSelector
                    availablePlatforms={[
                        { id: 'youtube', connected: false },
                        { id: 'tiktok', connected: false },
                    ]}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            expect(screen.getByText(/Nenhuma plataforma conectada/)).toBeInTheDocument();
        });

        it('should show warning when no platforms are selected', () => {
            render(
                <PlatformSelector
                    availablePlatforms={defaultAvailablePlatforms}
                    selectedPlatforms={[]}
                    onSelectionChange={mockOnSelectionChange}
                />
            );

            expect(screen.getByText(/Selecione pelo menos uma plataforma/)).toBeInTheDocument();
        });
    });
});
