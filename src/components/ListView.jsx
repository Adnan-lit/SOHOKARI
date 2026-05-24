import dayjs from 'dayjs'
import useTaskStore from '../store/useTaskStore'

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-500' },
  medium: { label: 'Medium', color: 'bg-amber-50 text-amber-600' },
  high: { label: 'High', color: 'bg-red-50 text-red-600' },
}

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-blue-50 text-blue-600' },
  'in-progress': { label: 'In Progress', color: 'bg-amber-50 text-amber-600' },
  done: { label: 'Done', color: 'bg-emerald-50 text-emerald-600' },
}

export default function ListView({ onEditTask }) {
  const tasks = useTaskStore((s) => s.tasks)

  const sorted = [...tasks].sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden max-w-5xl">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">All Tasks</h2>
        <p className="text-xs text-slate-400 mt-0.5">Sorted by deadline</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-slate-400">
          No tasks yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Assigned</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Time</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((task) => {
                const priority = priorityConfig[task.priority] || priorityConfig.low
                const status = statusConfig[task.status] || statusConfig.todo
                const deadline = dayjs(task.deadline)
                const isOverdue = deadline.isBefore(dayjs()) && task.status !== 'done'

                return (
                  <tr
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className={`font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {task.assignedTo ? (
                        <span className="text-xs text-slate-600">{task.assignedTo}</span>
                      ) : (
                        <span className="text-xs text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {task.estimatedTime ? (
                        <span className="text-xs text-slate-500">{task.estimatedTime}</span>
                      ) : (
                        <span className="text-xs text-slate-300">--</span>
                      )}
                    </td>
                    <td className={`px-5 py-3 text-right text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                      {deadline.format('MMM D, YYYY')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
