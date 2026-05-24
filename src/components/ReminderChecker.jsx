import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import useTaskStore from '../store/useTaskStore'
import dayjs from 'dayjs'

export default function ReminderChecker() {
  const tasks = useTaskStore((s) => s.tasks)
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    const check = () => {
      const now = dayjs()

      tasks.forEach((task) => {
        if (task.status === 'done') return
        if (notifiedRef.current.has(task.id)) return

        const deadline = dayjs(task.deadline)
        const hoursLeft = deadline.diff(now, 'hour', true)

        if (hoursLeft > 0 && hoursLeft <= 1) {
          toast(`Reminder: "${task.title}" is due within 1 hour!`, {
            icon: '\u23F0',
            duration: 5000,
          })
          notifiedRef.current.add(task.id)
        } else if (hoursLeft <= 0) {
          notifiedRef.current.add(task.id)
        }
      })
    }

    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [tasks])

  return null
}
