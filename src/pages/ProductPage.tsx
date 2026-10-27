import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CaretRight, ChatCircleText, Minus, Plus } from '@phosphor-icons/react'

import { catalog } from '@/api/client'
import { ApiError } from '@/api/client'
import { BookCover } from '@/components/BookCover'
import { ErrorState } from '@/components/ErrorState'
import { BookCard } from '@/features/catalog/BookCard'
import { useChat } from '@/features/chat/ChatContext'
import { categoryLabel, stockLabel } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

import { NotFound } from './NotFound'

export function ProductPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useAsync(() => catalog.get(id, 4), [id])
  const { send, sending } = useChat()
  const [quantity, setQuantity] = useState(1)

  if (error instanceof ApiError && error.status === 404) return <NotFound />
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 pt-16">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    )
  if (loading || !data)
    return (
      <div className="mx-auto grid max-w-6xl animate-pulse gap-12 px-4 pt-12 md:grid-cols-[360px_1fr]">
        <div className="aspect-[2/3] rounded bg-paper-200" />
        <div className="space-y-4">
          <div className="h-10 w-2/3 rounded bg-paper-200" />
          <div className="h-4 w-1/3 rounded bg-paper-200" />
          <div className="h-32 rounded bg-paper-200" />
        </div>
      </div>
    )

  const product = data
  const stock = stockLabel(product.stock)
  const max = Math.min(10, product.stock)
  const discountHint = quantity >= 5 ? 'até 10% de desconto' : quantity >= 3 ? 'até 5% de desconto' : null

  async function quote() {
    await send(`Quero comprar ${product.title}`, { type: 'select_product', product_id: product.product_id })
    await send(
      quantity === 1 ? 'Quero 1 exemplar' : `Quero ${quantity} exemplares`,
      { type: 'set_quantity', quantity },
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <nav aria-label="Trilha" className="flex items-center gap-1.5 text-xs text-ink-500">
        <Link to="/catalogo" className="hover:text-ink-900">
          Catálogo
        </Link>
        <CaretRight size={10} />
        <Link to={`/catalogo?categoria=${encodeURIComponent(product.category)}`} className="hover:text-ink-900">
          {categoryLabel(product.category)}
        </Link>
        <CaretRight size={10} />
        <span className="truncate text-ink-900">{product.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,360px)_1fr] md:gap-16">
        <div className="mx-auto w-full max-w-[300px] md:sticky md:top-32 md:max-w-none md:self-start">
          <BookCover product={product} className={product.in_stock ? '' : 'grayscale-[0.6]'} />
        </div>

        <div>
          <p className="eyebrow">{categoryLabel(product.category)}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] sm:text-[3.4rem]">{product.title}</h1>
          <p className="mt-3 text-lg text-ink-700">
            {product.author}
            {product.original_year ? <span className="text-ink-400"> · {product.original_year}</span> : null}
          </p>

          <p className="mt-8 border-l-2 border-vermilion-500 pl-5 font-display text-xl italic leading-relaxed text-ink-800">
            {product.tagline}
          </p>

          <div className="mt-8 rounded-xl border border-line bg-paper-100/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-display text-4xl font-semibold">{product.price}</p>
              <p
                className={`text-sm font-semibold ${
                  stock.tone === 'out' ? 'text-vermilion-600' : stock.tone === 'low' ? 'text-amber-600' : 'text-moss-600'
                }`}
              >
                {stock.text}
                {stock.tone === 'ok' && <span className="font-normal text-ink-500"> · {product.stock} disponíveis</span>}
              </p>
            </div>

            {product.in_stock ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-ink-900/15 bg-paper-50">
                  <button
                    type="button"
                    aria-label="Menos um exemplar"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => q - 1)}
                    className="grid size-10 place-items-center rounded-full hover:bg-paper-100 disabled:opacity-30"
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-semibold" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Mais um exemplar"
                    disabled={quantity >= max}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="grid size-10 place-items-center rounded-full hover:bg-paper-100 disabled:opacity-30"
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                </div>
                <button type="button" className="btn-accent flex-1 !py-3 sm:flex-none" disabled={sending} onClick={quote}>
                  <ChatCircleText size={18} weight="fill" /> Cotar com o livreiro
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-ghost mt-5"
                onClick={() => send(`Algo parecido com ${product.title}`, { type: 'browse_category', category: product.category })}
              >
                Pedir uma sugestão parecida
              </button>
            )}
            <p className="mt-3 text-xs text-ink-500">
              {discountHint
                ? `Com ${quantity} exemplares, o livreiro pode dar ${discountHint}.`
                : 'A partir de 3 exemplares o livreiro dá desconto.'}
            </p>
          </div>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Sinopse</h2>
            <p className="mt-4 max-w-[65ch] text-[1.05rem] leading-[1.75] text-ink-700 first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-vermilion-500">
              {product.description}
            </p>
          </section>
        </div>
      </div>

      {product.related && product.related.length > 0 && (
        <section className="mt-24">
          <div className="border-b border-line pb-4">
            <p className="eyebrow">Na mesma estante</p>
            <h2 className="mt-1.5 text-3xl font-semibold">Você também pode gostar</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
            {product.related.map((p) => (
              <BookCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
