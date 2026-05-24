import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import useTaskStore from '../store/useTaskStore'
import { useState } from 'react'

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-500' },
  medium: { label: 'Medium', color: 'bg-amber-50 text-amber-600' },
  high: { label: 'High', color: 'bg-red-50 text-red-600' },
}

function getCardColor(task) {
  if (task.status === 'done') return 'border-l-emerald-400'

  const now = dayjs()
  const deadline = dayjs(task.deadline)

  if (deadline.isBefore(now) || deadline.diff(now, 'hour') <= 24) {
    return 'border-l-red-400'
  }
  if (deadline.diff(now, 'day') <= 3) {
    return 'border-l-amber-400'
  }
  return 'border-l-blue-400'
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function TaskCard({ task, onEdit, isDragging }) {
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const cardColor = getCardColor(task)
  const priority = priorityConfig[task.priority] || priorityConfig.low
  const deadline = dayjs(task.deadline)
  const isOverdue = deadline.isBefore(dayjs()) && task.status !== 'done'
  const commentCount = (task.comments || []).length

  const handleDelete = () => {
    deleteTask(task.id)
    toast.success('Task deleted')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg border-l-4 ${cardColor}
        shadow-sm hover:shadow-md transition-shadow duration-150
        ${isSortDragging ? 'opacity-40' : ''}
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      {/* Drag handle area */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-3.5 pb-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug flex-1">
            {task.title}
          </h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${priority.color}`}>
            {priority.label}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 px-3.5 mt-2">
        {task.assignedTo && (
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center">
              {getInitials(task.assignedTo)}
            </span>
            <span className="text-[11px] text-slate-500 truncate max-w-20">{task.assignedTo}</span>
          </div>
        )}
        {task.estimatedTime && (
          <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {task.estimatedTime}
          </span>
        )}
        {commentCount > 0 && (
          <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {commentCount}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 py-2.5 mt-2 border-t border-slate-50">
        <span className={`text-[11px] font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {deadline.format('MMM D, YYYY')}
          {isOverdue && ' (overdue)'}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="px-3.5 pb-3 pt-1">
          <div className="bg-red-50 rounded-lg p-2.5 flex items-center gap-2">
            <p className="text-xs text-red-700 flex-1">Delete this task?</p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false) }}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-white transition-colors"
            >
              No
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
