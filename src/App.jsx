import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import KanbanBoard from './components/KanbanBoard'
import Dashboard from './components/Dashboard'
import CalendarPage from './components/CalendarPage'
import ListView from './components/ListView'
import AddTaskModal from './components/AddTaskModal'
import EditTaskModal from './components/EditTaskModal'
import ReminderChecker from './components/ReminderChecker'

function App() {
  const [page, setPage] = useState('board')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageConfig = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your tasks' },
    board: { title: 'Board', subtitle: 'Manage your tasks' },
    list: { title: 'List', subtitle: 'All tasks sorted by deadline' },
    calendar: { title: 'Calendar', subtitle: 'View tasks by deadline' },
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '10px',
            padding: '10px 16px',
          },
        }}
      />

      <ReminderChecker />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={page}
        onNavigate={(p) => { setPage(p); setSidebarOpen(false) }}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          title={pageConfig[page].title}
          subtitle={pageConfig[page].subtitle}
          onAddTask={() => setShowAddModal(true)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'board' && <KanbanBoard onEditTask={setEditingTask} />}
          {page === 'list' && <ListView onEditTask={setEditingTask} />}
          {page === 'calendar' && <CalendarPage onEditTask={setEditingTask} />}
        </main>
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </div>
  )
}

export default App
