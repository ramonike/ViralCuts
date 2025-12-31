import React, { useState } from 'react';
import { Widget } from '../../../design-system/components/Widget';
import { CheckSquare, Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

export const ChecklistWidget = () => {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Gravar introdução do vídeo', completed: true },
        { id: 2, text: 'Editar vídeo no Premiere', completed: true },
        { id: 3, text: 'Criar thumbnail', completed: false },
        { id: 4, text: 'Escrever descrição', completed: false },
        { id: 5, text: 'Agendar publicação', completed: false },
    ]);
    const [newTask, setNewTask] = useState('');

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        setTasks([...tasks, {
            id: Date.now(),
            text: newTask,
            completed: false,
        }]);
        setNewTask('');
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
        <Widget
            title="Checklist"
            icon={<CheckSquare className="w-4 h-4" />}
            color="teal"
            className="col-span-full lg:col-span-1"
        >
            {/* Progress */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Progresso</span>
                    <span className="text-xs font-bold text-teal-400">{completedCount}/{tasks.length}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-teal-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
                    >
                        <button
                            onClick={() => toggleTask(task.id)}
                            className="shrink-0"
                        >
                            {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            ) : (
                                <Circle className="w-4 h-4 text-slate-600" />
                            )}
                        </button>
                        <span className={`text-sm flex-1 ${task.completed ? 'text-slate-500 line-through' : 'text-white'
                            }`}>
                            {task.text}
                        </span>
                        <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded"
                        >
                            <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Task */}
            <form onSubmit={addTask} className="flex gap-2">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Nova tarefa..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </form>
        </Widget>
    );
};

export default ChecklistWidget;
