import React from 'react';
import { PageHeader } from '../ui';
import { cn } from '../../lib/utils';

export function PageLayout({ 
    title, 
    subtitle, 
    children, 
    headerActions = null,
    maxWidth = "7xl", // sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, full
    spacing = "standard" // compact, standard, spacious
}) {
    const spacingClasses = {
        compact: "gap-4",
        standard: "gap-6",
        spacious: "gap-8"
    };

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md", 
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-full"
    };

    return (
        <div className={cn("vc-page-layout animate-in fade-in slide-in-from-bottom-4 duration-500", spacingClasses[spacing])}>
            {(title || subtitle || headerActions) && (
                <div className={cn("mx-auto w-full", maxWidthClasses[maxWidth])}>
                    <PageHeader title={title} subtitle={subtitle}>
                        {headerActions}
                    </PageHeader>
                </div>
            )}

            <div className={cn("mx-auto w-full", maxWidthClasses[maxWidth])}>
                {children}
            </div>
        </div>
    );
}
