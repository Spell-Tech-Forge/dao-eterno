export function LoadingSpinner({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <div className="w-8 h-8 border-2 border-amber-900 border-t-amber-500 rounded-full animate-spin" />
      <span className="text-xs tracking-widest uppercase">{text}</span>
    </div>
  )
}
