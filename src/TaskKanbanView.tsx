import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, CheckCircle2, Clock3 } from "lucide-react";
import type { Task } from "./types";
import { priorityMeta, formatDate } from "./types";
import { useReducedMotion } from "./useReducedMotion";

type TaskKanbanViewProps = {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
};

/* ------------------------------------------------------------------ */
/* Sortable Task Card                                                  */
/* ------------------------------------------------------------------ */
function SortableCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  const shouldReduce = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? (shouldReduce ? "none" : undefined),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout={!shouldReduce}
      className={`kanban-card ${task.completed ? "is-completed" : ""}`}
      initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduce ? {} : { opacity: 0, scale: 0.9 }}
      transition={shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }}
    >
      <span className={`priority-dot priority-${task.priority}`} aria-hidden="true" />
      <button
        className="complete-button"
        type="button"
        title={task.completed ? "标记为未完成" : "标记为已完成"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>
      <div className="kanban-card-content">
        <h4>{task.title}</h4>
        <div className="kanban-card-meta">
          <Clock3 size={12} />
          <span>{formatDate(task.createdAt)}</span>
          <span className={`priority-tag priority-${task.priority}`}>
            {priorityMeta[task.priority].label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Droppable Column                                                    */
/* ------------------------------------------------------------------ */
function Column({
  title,
  tasks,
  columnId,
  isOver,
  count,
  onToggle,
}: {
  title: string;
  tasks: Task[];
  columnId: string;
  isOver: boolean;
  count: number;
  onToggle: (id: string) => void;
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  // Register the column as a droppable zone so cards can be dropped here
  const { setNodeRef: setDroppableRef, isOver: isDroppableOver } = useDroppable({
    id: `column-${columnId}`,
  });

  const highlight = isOver || isDroppableOver;

  return (
    <div
      ref={setDroppableRef}
      className={`kanban-column ${highlight ? "drop-target" : ""}`}
      data-column={columnId}
    >
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="kanban-count">{count}</span>
      </div>
      <div className="kanban-card-list">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableCard key={task.id} task={task} onToggle={onToggle} />
            ))}
          </AnimatePresence>
        </SortableContext>
        {tasks.length === 0 && (
          <div className="kanban-empty">拖拽任务到此处</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Resolve the column ID from a draggable/droppable/sortable identifier */
function getColumnFromId(
  id: string,
  activeIds: string[],
  completedIds: string[],
): "active" | "completed" | null {
  if (id.startsWith("column-")) {
    return id === "column-active" ? "active" : "completed";
  }
  if (activeIds.includes(id)) return "active";
  if (completedIds.includes(id)) return "completed";
  return null;
}

/* ------------------------------------------------------------------ */
/* Main Kanban View                                                    */
/* ------------------------------------------------------------------ */
export default function TaskKanbanView({ tasks, onToggleComplete }: TaskKanbanViewProps) {
  const shouldReduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const activeIds = useMemo(() => activeTasks.map((t) => t.id), [activeTasks]);
  const completedIds = useMemo(() => completedTasks.map((t) => t.id), [completedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const activeDragTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (!overId) {
      setOverColumnId(null);
      return;
    }
    const col = getColumnFromId(overId, activeIds, completedIds);
    setOverColumnId(col);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;
    const sourceCol = getColumnFromId(draggedId, activeIds, completedIds);
    const targetCol = getColumnFromId(overId, activeIds, completedIds);

    if (sourceCol && targetCol && sourceCol !== targetCol) {
      // Card moved between columns — toggle completion
      onToggleComplete(draggedId);
    }
  }

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Column
          title="进行中"
          tasks={activeTasks}
          columnId="active"
          isOver={overColumnId === "active"}
          count={activeTasks.length}
          onToggle={onToggleComplete}
        />
        <Column
          title="已完成"
          tasks={completedTasks}
          columnId="completed"
          isOver={overColumnId === "completed"}
          count={completedTasks.length}
          onToggle={onToggleComplete}
        />

        <DragOverlay dropAnimation={shouldReduce ? null : undefined}>
          {activeDragTask ? (
            <div className="kanban-card kanban-card-overlay">
              <span className={`priority-dot priority-${activeDragTask.priority}`} aria-hidden="true" />
              <button className="complete-button" type="button" disabled>
                {activeDragTask.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              <div className="kanban-card-content">
                <h4>{activeDragTask.title}</h4>
                <div className="kanban-card-meta">
                  <Clock3 size={12} />
                  <span>{formatDate(activeDragTask.createdAt)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
