interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'jade' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  variant = 'gold',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-cinzel tracking-wider border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    gold:   'bg-amber-950/40 border-amber-700 text-amber-400 hover:bg-amber-900/50 hover:border-amber-500',
    jade:   'bg-teal-950/40  border-teal-700  text-teal-400  hover:bg-teal-900/50  hover:border-teal-500',
    ghost:  'bg-transparent  border-slate-600 text-slate-400  hover:bg-slate-800/40 hover:border-slate-400',
    danger: 'bg-red-950/40   border-red-800   text-red-400   hover:bg-red-900/50   hover:border-red-600',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2 text-sm',
    lg: 'px-8 py-3 text-sm',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <><span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />Aguarde...</>
        : children}
    </button>
  )
}
