import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para navegação por teclado em listas e grids
 * @param {Object} options - Opções de configuração
 * @param {number} options.itemCount - Número total de itens
 * @param {number} options.columns - Número de colunas (para grids)
 * @param {Function} options.onSelect - Callback quando item é selecionado (Enter/Space)
 * @param {Function} options.onEscape - Callback quando Escape é pressionado
 * @param {boolean} options.wrap - Se deve voltar ao início/fim ao navegar
 * @param {boolean} options.enabled - Se a navegação está habilitada
 */
export function useKeyboardNavigation({
    itemCount,
    columns = 1,
    onSelect,
    onEscape,
    wrap = true,
    enabled = true
}) {
    const focusedIndexRef = useRef(0);
    const containerRef = useRef(null);

    const setFocusedIndex = useCallback((index) => {
        focusedIndexRef.current = index;
        
        // Foca o elemento correspondente
        if (containerRef.current) {
            const items = containerRef.current.querySelectorAll('[data-keyboard-item]');
            if (items[index]) {
                items[index].focus();
            }
        }
    }, []);

    const handleKeyDown = useCallback((event) => {
        if (!enabled || itemCount === 0) return;

        const currentIndex = focusedIndexRef.current;
        let newIndex = currentIndex;
        let handled = false;

        switch (event.key) {
            case 'ArrowDown':
                if (columns === 1) {
                    newIndex = currentIndex + 1;
                } else {
                    newIndex = currentIndex + columns;
                }
                handled = true;
                break;

            case 'ArrowUp':
                if (columns === 1) {
                    newIndex = currentIndex - 1;
                } else {
                    newIndex = currentIndex - columns;
                }
                handled = true;
                break;

            case 'ArrowRight':
                if (columns > 1) {
                    newIndex = currentIndex + 1;
                    handled = true;
                }
                break;

            case 'ArrowLeft':
                if (columns > 1) {
                    newIndex = currentIndex - 1;
                    handled = true;
                }
                break;

            case 'Home':
                newIndex = 0;
                handled = true;
                break;

            case 'End':
                newIndex = itemCount - 1;
                handled = true;
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                onSelect?.(currentIndex);
                return;

            case 'Escape':
                onEscape?.();
                return;

            default:
                return;
        }

        if (handled) {
            event.preventDefault();

            // Wrap ou clamp
            if (wrap) {
                if (newIndex < 0) newIndex = itemCount - 1;
                if (newIndex >= itemCount) newIndex = 0;
            } else {
                newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
            }

            setFocusedIndex(newIndex);
        }
    }, [enabled, itemCount, columns, wrap, onSelect, onEscape, setFocusedIndex]);

    // Adiciona listener ao container
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);

    // Reset ao mudar itemCount
    useEffect(() => {
        if (focusedIndexRef.current >= itemCount) {
            focusedIndexRef.current = Math.max(0, itemCount - 1);
        }
    }, [itemCount]);

    return {
        containerRef,
        focusedIndex: focusedIndexRef.current,
        setFocusedIndex,
        getItemProps: (index) => ({
            'data-keyboard-item': true,
            tabIndex: index === focusedIndexRef.current ? 0 : -1,
            'aria-selected': index === focusedIndexRef.current,
            onFocus: () => {
                focusedIndexRef.current = index;
            }
        })
    };
}

/**
 * Hook para anunciar mudanças para leitores de tela
 */
export function useAnnounce() {
    const announceRef = useRef(null);

    useEffect(() => {
        // Cria elemento de anúncio se não existir
        if (!announceRef.current) {
            const el = document.createElement('div');
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
            el.className = 'sr-only';
            document.body.appendChild(el);
            announceRef.current = el;
        }

        return () => {
            if (announceRef.current) {
                document.body.removeChild(announceRef.current);
                announceRef.current = null;
            }
        };
    }, []);

    const announce = useCallback((message, priority = 'polite') => {
        if (announceRef.current) {
            announceRef.current.setAttribute('aria-live', priority);
            announceRef.current.textContent = '';
            // Pequeno delay para garantir que o leitor de tela detecte a mudança
            setTimeout(() => {
                if (announceRef.current) {
                    announceRef.current.textContent = message;
                }
            }, 50);
        }
    }, []);

    return announce;
}

/**
 * Hook para gerenciar foco em modais/dialogs
 */
export function useFocusTrap(isOpen) {
    const containerRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Salva o elemento focado anteriormente
            previousFocusRef.current = document.activeElement;

            // Foca o primeiro elemento focável no container
            const container = containerRef.current;
            if (container) {
                const focusable = container.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length > 0) {
                    focusable[0].focus();
                }
            }
        } else {
            // Restaura o foco anterior
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    const handleKeyDown = useCallback((event) => {
        if (event.key !== 'Tab' || !containerRef.current) return;

        const focusable = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusable.length === 0) return;

        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    return containerRef;
}
