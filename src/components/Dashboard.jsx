import useTaskStore from '../store/useTaskStore'
import dayjs from 'dayjs'

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

export default function Dashboard({ onNavigate }) {
  const tasks = useTaskStore((s) => s.tasks)

  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const todo = tasks.filter((t) => t.status === 'todo').length
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && dayjs(t.deadline).isBefore(dayjs())
  ).length

  const upcomingDeadlines = [...tasks]
    .filter((t) => t.status !== 'done' && dayjs(t.deadline).isAfter(dayjs()))
    .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))
    .slice(0, 5)

  const recentTasks = [...tasks].slice(-5).reverse()

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={total} color="text-slate-800" />
        <StatCard label="Completed" value={completed} color="text-emerald-600" />
        <StatCard label="In Progress" value={inProgress} color="text-amber-600" />
        <StatCard label="Overdue" value={overdue} color="text-red-500" />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Completion Rate</h2>
          <span className="text-sm font-bold text-emerald-600">{completionRate}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {completed} of {total} tasks completed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Upcoming Deadlines</h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No upcoming deadlines</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeadlines.map((task) => (
                <li key={task.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 shrink-0">
                    {dayjs(task.deadline).format('MMM D')}
                  </span>
                  <span className="text-sm text-slate-700 truncate flex-1">{task.title}</span>
                  {task.assignedTo && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[60px]">{task.assignedTo}</span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(priorityConfig[task.priority] || priorityConfig.low).color}`}>
                    {(priorityConfig[task.priority] || priorityConfig.low).label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent tasks */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No tasks yet</p>
          ) : (
            <ul className="space-y-3">
              {recentTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(statusConfig[task.status] || statusConfig.todo).color}`}>
                    {(statusConfig[task.status] || statusConfig.todo).label}
                  </span>
                  <span className="text-sm text-slate-700 truncate flex-1">{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('board')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            Go to Board
          </button>
          <button
            onClick={() => onNavigate('list')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            View List
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            View Calendar
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}
