import { ArrowClockwise, CloudSlash } from '@phosphor-icons/react'

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <CloudSlash size={32} className="text-ink-400" />
      <p className="font-display text-lg font-semibold">Não conseguimos carregar agora</p>
      <p className="max-w-sm text-sm text-ink-500">
        {message || 'O catálogo está temporariamente indisponível.'} Seus pedidos e conversas não se perdem.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost mt-1">
          <ArrowClockwise size={16} weight="bold" /> Tentar de novo
        </button>
      )}
    </div>
  )
}
