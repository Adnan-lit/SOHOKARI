import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import useTaskStore from '../store/useTaskStore'

export default function AddAccountModal({ isOpen, onClose }) {
  const [name, setName] = useState('')
  const addUser = useTaskStore((state) => state.addUser)

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name cannot be empty')
      return
    }
    try {
      addUser(trimmed)
      toast.success(`Account "${trimmed}" created`)
      setName('')
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl mb-4">Create Account</h2>
        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
