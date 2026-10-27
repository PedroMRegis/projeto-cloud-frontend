import { Link } from 'react-router-dom'

export function NotFound({ what = 'página' }: { what?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-24 text-center">
      <p className="font-display text-8xl font-light italic text-vermilion-500">404</p>
      <h1 className="mt-4 text-3xl font-semibold">Esta {what} não está na estante</h1>
      <p className="mt-3 text-ink-500">Pode ter mudado de lugar, ou nunca ter existido.</p>
      <Link to="/" className="btn-primary mt-8">
        Voltar à livraria
      </Link>
    </div>
  )
}
