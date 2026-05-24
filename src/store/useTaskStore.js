import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useTaskStore = create(
  persist(
    (set, get) => ({
      // Tasks
      tasks: [],

      // Users
      users: [],
      activeUserId: null,

      // User management
      addUser: (name) => {
        // Check for duplicate names (case-insensitive)
        const exists = get().users.some(
          (user) => user.name.toLowerCase() === name.toLowerCase().trim()
        )
        if (exists) {
          throw new Error('User with this name already exists')
        }

        const newUser = {
          id: crypto.randomUUID(),
          name: name.trim(),
          createdAt: new Date().toISOString(),
        }

        set((state) => {
          const updatedUsers = [...state.users, newUser]
          // If no active user, set the new user as active
          const activeUserId = state.activeUserId || newUser.id
          return { users: updatedUsers, activeUserId }
        })
      },

      setActiveUser: (userId) => {
        set({ activeUserId: userId })
      },

      removeUser: (userId) => {
        set((state) => {
          // Don't allow removing the last user
          if (state.users.length <= 1) {
            throw new Error('Cannot remove the last user')
          }

          const updatedUsers = state.users.filter((user) => user.id !== userId)
          // If removing active user, switch to first available user
          const activeUserId =
            state.activeUserId === userId
              ? updatedUsers[0].id
              : state.activeUserId

          return { users: updatedUsers, activeUserId }
        })
      },

      getUserById: (userId) => {
        return get().users.find((user) => user.id === userId)
      },

      getUserNameById: (userId) => {
        const user = get().users.find((user) => user.id === userId)
        return user ? user.name : undefined
      },

      // Task management with user tracking
      addTask: (task) =>
        set((state) => {
          const newTask = {
            ...task,
            id: crypto.randomUUID(),
            comments: [],
            estimatedTime: task.estimatedTime || '',
            // Store user IDs instead of names
            assignedTo: task.assignedTo || state.activeUserId || '',
            // Automatically set creator to active user
            createdBy: state.activeUserId || '',
          }

          return {
            tasks: [...state.tasks, newTask],
          }
        }),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addComment: (taskId, text) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: [
                    ...(t.comments || []),
                    { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() },
                  ],
                }
              : t
          ),
        })),

      deleteComment: (taskId, commentId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, comments: (t.comments || []).filter((c) => c.id !== commentId) }
              : t
          ),
        })),

      clearAll: () => set({ tasks: [], users: [], activeUserId: null }),

      moveTask: (taskId, newStatus, newIndex) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId)
          if (!task) return state

          const otherTasks = state.tasks.filter((t) => t.id !== taskId)
          const tasksInColumn = otherTasks.filter((t) => t.status === newStatus)
          const tasksNotInColumn = otherTasks.filter((t) => t.status !== newStatus)

          const updatedTask = { ...task, status: newStatus }
          tasksInColumn.splice(newIndex, 0, updatedTask)

          return { tasks: [...tasksNotInColumn, ...tasksInColumn] }
        }),

      reorderInColumn: (status, oldIndex, newIndex) =>
        set((state) => {
          const tasksInColumn = state.tasks.filter((t) => t.status === status)
          const tasksNotInColumn = state.tasks.filter((t) => t.status !== status)

          const [moved] = tasksInColumn.splice(oldIndex, 1)
          tasksInColumn.splice(newIndex, 0, moved)

          return { tasks: [...tasksNotInColumn, ...tasksInColumn] }
        }),
    }),
    { name: 'taskflow-storage' }
  )
)

export default useTaskStore
