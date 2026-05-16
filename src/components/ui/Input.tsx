interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs text-slate-500 tracking-widest uppercase">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'bg-slate-900 border text-slate-200 px-3 py-2.5 text-sm',
          'focus:outline-none focus:ring-1 transition-colors duration-150',
          'placeholder:text-slate-600',
          error
            ? 'border-red-700 focus:border-red-500 focus:ring-red-900'
            : 'border-slate-700 focus:border-amber-700 focus:ring-amber-950',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
