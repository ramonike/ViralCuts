/**
 * PlatformStatus Component Tests
 * Tests for platform upload status display
 * Requirements: 3.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlatformStatus, PlatformStatusList } from './PlatformStatus';

describe('PlatformStatus', () => {
    const mockOnRetry = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Status Display', () => {
        it('should display pending status', () => {
            render(
                <PlatformStatus
                    platform="youtube"
                    status="pending"
                />
            );

            expect(screen.getByText('YouTube')).toBeInTheDocument();
            expect(screen.getByText('Pendente')).toBeInTheDocument();
        });

        it('should display uploading status with animation', () => {
            render(
                <PlatformStatus
                    platform="tiktok"
                    status="uploading"
                />
            );

            expect(screen.getByText('TikTok')).toBeInTheDocument();
            expect(screen.getByText('Enviando')).toBeInTheDocument();
            expect(screen.getByText('Enviando vídeo...')).toBeInTheDocument();
        });

        it('should display processing status', () => {
            render(
                <PlatformStatus
                    platform="instagram"
                    status="processing"
                />
            );

            expect(screen.getByText('Instagram')).toBeInTheDocument();
            expect(screen.getByText('Processando')).toBeInTheDocument();
            expect(screen.getByText('Processando no servidor...')).toBeInTheDocument();
        });

        it('should display published status with link', () => {
            render(
                <PlatformStatus
                    platform="youtube"
                    status="published"
                    platformVideoId="abc123"
                    platformVideoUrl="https://youtube.com/watch?v=abc123"
                    publishedAt={new Date('2025-01-15T10:00:00Z')}
                />
            );

            expect(screen.getByText('Publicado')).toBeInTheDocument();
            expect(screen.getByText('Ver vídeo')).toBeInTheDocument();
            
            const link = screen.getByRole('link', { name: /Ver vídeo/ });
            expect(link).toHaveAttribute('href', 'https://youtube.com/watch?v=abc123');
        });

        it('should display failed status with error message', () => {
            render(
                <PlatformStatus
                    platform="tiktok"
                    status="failed"
                    error="Upload quota exceeded"
                    onRetry={mockOnRetry}
                />
            );

            expect(screen.getByText('Falhou')).toBeInTheDocument();
            expect(screen.getByText('Upload quota exceeded')).toBeInTheDocument();
            expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
        });

        it('should display scheduled status with date', () => {
            render(
                <PlatformStatus
                    platform="youtube"
                    status="scheduled"
                    scheduledAt={new Date('2025-01-20T15:00:00Z')}
                />
            );

            expect(screen.getByText('Agendado')).toBeInTheDocument();
            expect(screen.getByText(/Agendado para/)).toBeInTheDocument();
        });
    });

    describe('Retry Action', () => {
        it('should call onRetry when retry button is clicked', () => {
            render(
                <PlatformStatus
                    platform="tiktok"
                    status="failed"
                    error="Network error"
                    onRetry={mockOnRetry}
                />
            );

            const retryButton = screen.getByText('Tentar novamente');
            fireEvent.click(retryButton);

            expect(mockOnRetry).toHaveBeenCalledWith('tiktok');
        });

        it('should not show retry button when status is not failed', () => {
            render(
                <PlatformStatus
                    platform="youtube"
                    status="published"
                    onRetry={mockOnRetry}
                />
            );

            expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument();
        });
    });

    describe('Compact Mode', () => {
        it('should render compact version', () => {
            render(
                <PlatformStatus
                    platform="youtube"
                    status="published"
                    platformVideoUrl="https://youtube.com/watch?v=abc123"
                    compact={true}
                />
            );

            // In compact mode, should not show full text
            expect(screen.queryByText('Ver vídeo')).not.toBeInTheDocument();
        });
    });
});

describe('PlatformStatusList', () => {
    const mockOnRetry = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render multiple platform statuses', () => {
        const platformStatuses = [
            { platform: 'youtube', status: 'published', platformVideoId: 'yt123' },
            { platform: 'tiktok', status: 'uploading' },
            { platform: 'instagram', status: 'pending' },
        ];

        render(
            <PlatformStatusList
                platformStatuses={platformStatuses}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('YouTube')).toBeInTheDocument();
        expect(screen.getByText('TikTok')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    it('should show empty message when no platforms', () => {
        render(
            <PlatformStatusList
                platformStatuses={[]}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Nenhuma plataforma selecionada')).toBeInTheDocument();
    });

    it('should render compact list', () => {
        const platformStatuses = [
            { platform: 'youtube', status: 'published' },
            { platform: 'tiktok', status: 'published' },
        ];

        render(
            <PlatformStatusList
                platformStatuses={platformStatuses}
                onRetry={mockOnRetry}
                compact={true}
            />
        );

        // In compact mode, icons are rendered but not text labels
        // Check that the container has the expected structure
        const container = document.querySelector('.flex.flex-wrap');
        expect(container).toBeInTheDocument();
        expect(container.children.length).toBe(2);
    });
});
