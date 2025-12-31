import React, { useState } from 'react';
import { Widget } from '../../../design-system/components/Widget';
import { StickyNote, Save, X } from 'lucide-react';
import { Button } from '../ui/button';

export const QuickNotesWidget = () => {
    const [notes, setNotes] = useState([
        { id: 1, text: 'Ideia: Tutorial sobre IA generativa', color: 'yellow' },
        { id: 2, text: 'Lembrar de responder comentários', color: 'blue' },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [selectedColor, setSelectedColor] = useState('yellow');

    const colors = {
        yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
        blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
        green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
        purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    };

    const addNote = () => {
        if (!newNote.trim()) return;

        setNotes([...notes, {
            id: Date.now(),
            text: newNote,
            color: selectedColor,
        }]);
        setNewNote('');
        setIsAdding(false);
    };

    const deleteNote = (id) => {
        setNotes(notes.filter(note => note.id !== id));
    };

    return (
        <Widget
            title="Quick Notes"
            icon={<StickyNote className="w-4 h-4" />}
            color="lime"
            className="col-span-full lg:col-span-1"
            actions={
                !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
                    >
                        <StickyNote className="w-3 h-3" />
                        Nova nota
                    </button>
                )
            }
        >
            {/* Notes List */}
            <div className="space-y-2 mb-3">
                {notes.map((note) => {
                    const colorClasses = colors[note.color];
                    return (
                        <div
                            key={note.id}
                            className={`p-3 rounded-lg border ${colorClasses.bg} ${colorClasses.border} group relative`}
                        >
                            <p className="text-sm text-white pr-6">{note.text}</p>
                            <button
                                onClick={() => deleteNote(note.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded"
                            >
                                <X className="w-3 h-3 text-slate-400" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Note Form */}
            {isAdding && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Digite sua nota..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
                        rows={3}
                        autoFocus
                    />

                    {/* Color Picker */}
                    <div className="flex items-center gap-2">
                        {Object.entries(colors).map(([colorName, colorClasses]) => (
                            <button
                                key={colorName}
                                onClick={() => setSelectedColor(colorName)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColor === colorName ? 'scale-110 border-white' : 'border-transparent'
                                    } ${colorClasses.bg}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={addNote}
                            size="sm"
                            className="flex-1 bg-lime-600 hover:bg-lime-700"
                        >
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                        </Button>
                        <Button
                            onClick={() => {
                                setIsAdding(false);
                                setNewNote('');
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {notes.length === 0 && !isAdding && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    Nenhuma nota ainda
                </div>
            )}
        </Widget>
    );
};

export default QuickNotesWidget;
