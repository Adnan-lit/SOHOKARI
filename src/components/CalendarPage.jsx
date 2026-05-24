import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import useTaskStore from '../store/useTaskStore'
import dayjs from 'dayjs'

const priorityColors = {
  low: { bg: '#e2e8f0', border: '#94a3b8', text: '#475569' },
  medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  high: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
}

const statusColors = {
  todo: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  'in-progress': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  done: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
}

export default function CalendarPage({ onEditTask }) {
  const tasks = useTaskStore((s) => s.tasks)

  const events = tasks.map((task) => {
    const colors = task.status === 'done'
      ? statusColors.done
      : priorityColors[task.priority] || priorityColors.low

    return {
      id: task.id,
      title: task.title,
      date: task.deadline,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { task },
    }
  })

  const handleEventClick = (info) => {
    const task = info.event.extendedProps.task
    if (task) onEditTask(task)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6 max-w-5xl">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth',
        }}
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
        fixedWeekCount={false}
      />
    </div>
  )
}
