import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWidgetLayout } from '../../contexts/WidgetLayoutContext';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

export const WidgetGrid = ({ children }) => {
    const { widgets, isEditing, updateWidgetPosition } = useWidgetLayout();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = widgets.findIndex(w => w.id === active.id);
            const newIndex = widgets.findIndex(w => w.id === over.id);

            const newWidgets = arrayMove(widgets, oldIndex, newIndex);
            // Update positions based on new order
            newWidgets.forEach((widget, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                updateWidgetPosition(widget.id, { x: col * 4, y: row * 4 });
            });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {React.Children.map(children, (child, index) => {
                        const widget = widgets[index];
                        if (!widget) return null;

                        return (
                            <SortableWidget
                                key={widget.id}
                                id={widget.id}
                                isEditing={isEditing}
                            >
                                {child}
                            </SortableWidget>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
};

const SortableWidget = ({ id, isEditing, children }) => {
    const { removeWidget } = useWidgetLayout();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative ${isEditing ? 'ring-2 ring-primary-500/50' : ''}`}
        >
            {isEditing && (
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                        onClick={() => removeWidget(id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-900/50 rounded border border-slate-700 hover:border-red-500"
                    >
                        <X className="w-4 h-4 text-red-400" />
                    </button>
                </div>
            )}
            {children}
        </div>
    );
};

export default WidgetGrid;
