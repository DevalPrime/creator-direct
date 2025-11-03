import { Toast } from '../types'

interface ToastContainerProps {
  toasts: Toast[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
