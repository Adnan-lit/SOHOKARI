import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import Column from './Column'
import TaskCard from './TaskCard'
import useTaskStore from '../store/useTaskStore'

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500', lightColor: 'bg-blue-50' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-amber-500', lightColor: 'bg-amber-50' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500', lightColor: 'bg-emerald-50' },
]

export default function KanbanBoard({ onEditTask }) {
  const tasks = useTaskStore((s) => s.tasks)
  const moveTask = useTaskStore((s) => s.moveTask)
  const reorderInColumn = useTaskStore((s) => s.reorderInColumn)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Determine target column
    let targetColumn
    let targetIndex

    // Check if dropped on a column directly
    const overColumn = columns.find((c) => c.id === overId)
    if (overColumn) {
      targetColumn = overColumn.id
      const tasksInTarget = tasks.filter((t) => t.status === targetColumn)
      targetIndex = tasksInTarget.length
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t.id === overId)
      if (!overTask) return
      targetColumn = overTask.status
      const tasksInTarget = tasks.filter((t) => t.status === targetColumn)
      targetIndex = tasksInTarget.findIndex((t) => t.id === overId)
      if (targetIndex === -1) targetIndex = tasksInTarget.length
    }

    if (activeTask.status === targetColumn) {
      // Same column reorder
      const tasksInColumn = tasks.filter((t) => t.status === targetColumn)
      const oldIndex = tasksInColumn.findIndex((t) => t.id === activeId)
      if (oldIndex !== targetIndex) {
        reorderInColumn(targetColumn, oldIndex, targetIndex)
      }
    } else {
      // Cross-column move
      moveTask(activeId, targetColumn, targetIndex)
    }
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // If hovering over a column container, move to that column
    const overColumn = columns.find((c) => c.id === overId)
    if (overColumn && activeTask.status !== overColumn.id) {
      moveTask(activeId, overColumn.id, tasks.filter((t) => t.status === overColumn.id).length)
    }

    // If hovering over a task in a different column
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTask.status !== overTask.status) {
      const tasksInTarget = tasks.filter((t) => t.status === overTask.status)
      const targetIndex = tasksInTarget.findIndex((t) => t.id === overId)
      moveTask(activeId, overTask.status, targetIndex >= 0 ? targetIndex : 0)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-5 h-full min-h-0 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="rotate-2 opacity-90">
            <TaskCard task={activeTask} onEdit={() => {}} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
