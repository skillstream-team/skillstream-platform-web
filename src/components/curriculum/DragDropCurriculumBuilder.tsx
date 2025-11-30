import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Edit3, Video, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text';
  duration?: string;
  videoUrl?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface DragDropCurriculumBuilderProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  onEditModule?: (moduleId: string) => void;
  onEditLesson?: (moduleId: string, lessonId: string) => void;
  onDeleteModule?: (moduleId: string) => void;
  onDeleteLesson?: (moduleId: string, lessonId: string) => void;
  onAddModule?: () => void;
  onAddLesson?: (moduleId: string) => void;
}

interface SortableModuleProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  children: React.ReactNode;
}

interface SortableLessonProps {
  lesson: Lesson;
  moduleId: string;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableModule({
  module,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  children,
}: SortableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded-lg mb-3 ${
        isDragging ? 'shadow-lg' : ''
      }`}
      style={{
        ...style,
        borderColor: '#E5E7EB',
        backgroundColor: 'white'
      }}
    >
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-5 w-5" style={{ color: '#6F73D2' }} />
          </div>
          
          <button
            onClick={onToggle}
            className="flex-1 text-left flex items-center space-x-3"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" style={{ color: '#6F73D2' }} />
            ) : (
              <ChevronDown className="h-4 w-4" style={{ color: '#6F73D2' }} />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg" style={{ color: '#0B1E3F' }}>
                {module.title}
              </h3>
              {module.description && (
                <p className="text-sm mt-1" style={{ color: '#6F73D2' }}>
                  {module.description}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: '#6F73D2' }}>
                {module.lessons.length} lessons
              </p>
            </div>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onAddLesson}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Add Lesson"
            >
              <Plus className="h-4 w-4" style={{ color: '#00B5AD' }} />
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit Module"
            >
              <Edit3 className="h-4 w-4" style={{ color: '#6F73D2' }} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete Module"
            >
              <Trash2 className="h-4 w-4" style={{ color: '#EF4444' }} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pl-8">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableLesson({ lesson, moduleId, onEdit, onDelete }: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center space-x-3 p-3 rounded-lg mb-2 ${
        isDragging ? 'shadow-md' : ''
      }`}
      style={{
        ...style,
        backgroundColor: 'rgba(0, 181, 173, 0.05)',
        border: '1px solid #E5E7EB'
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-white rounded"
      >
        <GripVertical className="h-4 w-4" style={{ color: '#6F73D2' }} />
      </div>

      <div className="flex-shrink-0">
        {lesson.type === 'video' ? (
          <Video className="h-4 w-4" style={{ color: '#00B5AD' }} />
        ) : (
          <FileText className="h-4 w-4" style={{ color: '#6F73D2' }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate" style={{ color: '#0B1E3F' }}>
          {lesson.title}
        </h4>
        {lesson.duration && (
          <p className="text-xs" style={{ color: '#6F73D2' }}>
            {lesson.duration}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-white transition-colors"
          title="Edit Lesson"
        >
          <Edit3 className="h-3.5 w-3.5" style={{ color: '#6F73D2' }} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-50 transition-colors"
          title="Delete Lesson"
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  );
}

export const DragDropCurriculumBuilder: React.FC<DragDropCurriculumBuilderProps> = ({
  modules,
  onModulesChange,
  onEditModule,
  onEditLesson,
  onDeleteModule,
  onDeleteLesson,
  onAddModule,
  onAddLesson,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a module
    const activeModuleIndex = modules.findIndex((m) => m.id === activeId);
    const overModuleIndex = modules.findIndex((m) => m.id === overId);

    if (activeModuleIndex !== -1 && overModuleIndex !== -1) {
      // Reordering modules
      const newModules = arrayMove(modules, activeModuleIndex, overModuleIndex);
      onModulesChange(newModules);
      return;
    }

    // Check if dragging a lesson
    for (const module of modules) {
      const activeLessonIndex = module.lessons.findIndex((l) => l.id === activeId);
      const overLessonIndex = module.lessons.findIndex((l) => l.id === overId);

      if (activeLessonIndex !== -1 && overLessonIndex !== -1) {
        // Reordering lessons within the same module
        const newLessons = arrayMove(module.lessons, activeLessonIndex, overLessonIndex);
        const newModules = modules.map((m) =>
          m.id === module.id ? { ...m, lessons: newLessons } : m
        );
        onModulesChange(newModules);
        return;
      }

      // Check if moving lesson to different module
      if (activeLessonIndex !== -1) {
        const sourceModule = module;
        const targetModule = modules.find((m) => m.lessons.some((l) => l.id === overId));

        if (targetModule && targetModule.id !== sourceModule.id) {
          const lesson = sourceModule.lessons[activeLessonIndex];
          const newSourceLessons = sourceModule.lessons.filter((l) => l.id !== activeId);
          const targetLessonIndex = targetModule.lessons.findIndex((l) => l.id === overId);
          const newTargetLessons = [
            ...targetModule.lessons.slice(0, targetLessonIndex),
            lesson,
            ...targetModule.lessons.slice(targetLessonIndex),
          ];

          const newModules = modules.map((m) => {
            if (m.id === sourceModule.id) {
              return { ...m, lessons: newSourceLessons };
            }
            if (m.id === targetModule.id) {
              return { ...m, lessons: newTargetLessons };
            }
            return m;
          });

          onModulesChange(newModules);
          return;
        }
      }
    }
  };

  const allItemIds = [
    ...modules.map((m) => m.id),
    ...modules.flatMap((m) => m.lessons.map((l) => l.id)),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
          Course Curriculum
        </h3>
        {onAddModule && (
          <button
            onClick={onAddModule}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: '#00B5AD' }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Module</span>
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
          {modules.map((module) => (
            <SortableModule
              key={module.id}
              module={module}
              isExpanded={expandedModules.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              onEdit={() => onEditModule?.(module.id)}
              onDelete={() => onDeleteModule?.(module.id)}
              onAddLesson={() => onAddLesson?.(module.id)}
              onEditLesson={(lessonId) => onEditLesson?.(module.id, lessonId)}
              onDeleteLesson={(lessonId) => onDeleteLesson?.(module.id, lessonId)}
            >
              <SortableContext
                items={module.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {module.lessons.map((lesson) => (
                  <SortableLesson
                    key={lesson.id}
                    lesson={lesson}
                    moduleId={module.id}
                    onEdit={() => onEditLesson?.(module.id, lesson.id)}
                    onDelete={() => onDeleteLesson?.(module.id, lesson.id)}
                  />
                ))}
              </SortableContext>
            </SortableModule>
          ))}
        </SortableContext>
      </DndContext>

      {modules.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-gray-500 mb-4">No modules yet. Add your first module to get started!</p>
          {onAddModule && (
            <button
              onClick={onAddModule}
              className="px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#00B5AD' }}
            >
              Add First Module
            </button>
          )}
        </div>
      )}
    </div>
  );
};

