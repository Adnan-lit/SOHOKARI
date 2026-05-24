import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

export default function Column({ column, tasks, onEditTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex-1 min-w-[280px] max-w-[400px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <span className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
        <h2 className="text-sm font-semibold text-slate-700">{column.title}</h2>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
          {tasks.length}
        </span>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-xl p-2.5 space-y-2.5 overflow-y-auto
          transition-colors duration-150
          ${column.lightColor}
          ${isOver ? 'ring-2 ring-blue-300 ring-offset-1' : ''}
        `}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-slate-400">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
