import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from "../../lib/utils";

const DropdownMenuContext = createContext({ open: false, setOpen: () => {} });

export const DropdownMenu = ({ children }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left" ref={ref}>{children}</div>
        </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger = ({ children, asChild }) => {
    const { open, setOpen } = useContext(DropdownMenuContext);
    const handleClick = () => setOpen(!open);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick: handleClick, "data-state": open ? "open" : "closed" });
    }

    return <button onClick={handleClick} data-state={open ? "open" : "closed"}>{children}</button>;
};

export const DropdownMenuContent = ({ children, className }) => {
    const { open } = useContext(DropdownMenuContext);
    if (!open) return null;

    return (
        <div className={cn(
            "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-card)] p-1 shadow-[var(--shadow-elevated)] vc-animate-in",
            className
        )}>
            {children}
        </div>
    );
};

export const DropdownMenuItem = ({ children, onClick, className }) => {
    const { setOpen } = useContext(DropdownMenuContext);
    const handleClick = (e) => { onClick?.(e); setOpen(false); };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                className
            )}
        >
            {children}
        </div>
    );
};

export const DropdownMenuLabel = ({ children, className }) => (
    <div className={cn("px-2 py-1.5 text-sm font-semibold text-[var(--text-secondary)]", className)}>{children}</div>
);

export const DropdownMenuSeparator = ({ className }) => (
    <div className={cn("-mx-1 my-1 h-px bg-[var(--border-subtle)]", className)} />
);
