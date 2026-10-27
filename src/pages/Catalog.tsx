import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkle, X } from '@phosphor-icons/react'

import { catalog } from '@/api/client'
import { ErrorState } from '@/components/ErrorState'
import { BookCard, BookCardSkeleton } from '@/features/catalog/BookCard'
import { useChat } from '@/features/chat/ChatContext'
import { categoryLabel } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { Product } from '@/types/api'

const PAGE = 12

const SORTS: [string, string][] = [
  ['title', 'Título (A–Z)'],
  ['price_asc', 'Menor preço'],
  ['price_desc', 'Maior preço'],
  ['newest', 'Mais recentes'],
]

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = params.get('categoria') ?? ''
  const sort = params.get('ordem') ?? 'title'
  const { send } = useChat()

  const categories = useAsync(() => catalog.categories(), [])
  const [extra, setExtra] = useState<Product[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const page = useAsync(
    () => catalog.list({ q, category: category || undefined, sort, limit: q ? 24 : PAGE }),
    [q, category, sort],
  )
  useEffect(() => setExtra([]), [q, category, sort])

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const shown = (page.data?.products.length ?? 0) + extra.length
      const more = await catalog.list({ category: category || undefined, sort, limit: PAGE, offset: shown })
      setExtra((current) => [...current, ...more.products])
    } finally {
      setLoadingMore(false)
    }
  }

  const products = [...(page.data?.products ?? []), ...extra]
  const total = page.data?.total
  const heading = q ? `Resultados para “${q}”` : category ? categoryLabel(category) : 'Todo o catálogo'

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{q ? 'Busca' : 'Estante'}</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{heading}</h1>
          {page.data && (
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
              {q
                ? `${page.data.count} ${page.data.count === 1 ? 'livro encontrado' : 'livros encontrados'}`
                : `${total ?? page.data.count} títulos`}
              {page.data.mode === 'hybrid' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-vermilion-50 px-2 py-0.5 text-xs font-semibold text-vermilion-600">
                  <Sparkle size={12} weight="fill" /> busca por significado
                </span>
              )}
            </p>
          )}
        </div>
        {!q && (
          <label className="flex items-center gap-2 text-sm text-ink-500">
            Ordenar por
            <select
              value={sort}
              onChange={(e) => update('ordem', e.target.value)}
              className="rounded-full border border-ink-900/15 bg-paper-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-ink-900"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[200px_1fr]">
        <aside aria-label="Filtrar por categoria">
          <p className="eyebrow">Estantes</p>
          <ul className="mt-3 flex flex-wrap gap-2 md:flex-col md:gap-0.5">
            <li>
              <button
                type="button"
                onClick={() => update('categoria', '')}
                className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  !category ? 'bg-ink-900 text-paper-50' : 'hover:bg-paper-100'
                }`}
              >
                Todas
              </button>
            </li>
            {categories.data?.map((c) => (
              <li key={c.category}>
                <button
                  type="button"
                  onClick={() => update('categoria', c.category)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    category === c.category ? 'bg-ink-900 text-paper-50' : 'hover:bg-paper-100'
                  }`}
                >
                  {categoryLabel(c.category)}
                  <span className="font-mono text-xs opacity-60">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
          {q && (
            <Link to="/catalogo" className="mt-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
              <X size={14} /> Limpar busca
            </Link>
          )}
        </aside>

        <section>
          {page.error ? (
            <ErrorState message={page.error.message} onRetry={page.reload} />
          ) : page.loading ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <BookCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
              <p className="font-display text-2xl font-semibold">Nada por aqui com esse nome</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
                Talvez o livreiro ache pelo assunto. Descreva o que você procura e ele busca para você.
              </p>
              <button type="button" className="btn-accent mt-5" onClick={() => send(q || 'Me recomenda um livro?')}>
                Perguntar ao livreiro
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <BookCard key={p.product_id} product={p} />
                ))}
              </div>
              {!q && total !== undefined && products.length < total && (
                <div className="mt-12 text-center">
                  <button type="button" className="btn-ghost" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? 'Carregando…' : `Mostrar mais (${total - products.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
