import { Link } from 'react-router-dom'
import { ArrowRight, ChatCircleText } from '@phosphor-icons/react'

import { catalog } from '@/api/client'
import { BookCover } from '@/components/BookCover'
import { ErrorState } from '@/components/ErrorState'
import { BookCard, BookCardSkeleton } from '@/features/catalog/BookCard'
import { useChat } from '@/features/chat/ChatContext'
import { categoryLabel } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

const HERO_BOOKS = [
  { product_id: 'BK001', title: 'Dom Casmurro', author: 'Machado de Assis' },
  { product_id: 'BK029', title: 'Duna', author: 'Frank Herbert' },
  { product_id: 'BK016', title: '1984', author: 'George Orwell' },
]

const PROMPTS = ['Um clássico brasileiro curto', 'Algo sobre vigilância', 'Presente para quem programa']

const FEATURED_ID = 'BK003'

export function Home() {
  const { openChat, send } = useChat()

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div>
          <p className="eyebrow">Livraria conversacional</p>
          <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl">
            Diga o que quer ler.
            <br />
            <span className="italic text-vermilion-500">O livreiro</span> encontra, cota e separa.
          </h1>
          <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-700">
            Sem carrinho e sem formulário: você conversa, recebe a cotação com o desconto que a casa
            permite e confirma o pedido. O estoque é reservado em segundos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-accent !px-6 !py-3" onClick={openChat}>
              <ChatCircleText size={19} weight="fill" /> Conversar com o livreiro
            </button>
            <Link to="/catalogo" className="btn-ghost !px-6 !py-3">
              Explorar o catálogo
            </Link>
          </div>
          <div className="mt-8">
            <p className="text-xs text-ink-500">Experimente pedir:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROMPTS.map((prompt) => (
                <button key={prompt} type="button" className="chip" onClick={() => send(prompt)}>
                  “{prompt}”
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto h-[340px] w-full max-w-[420px] sm:h-[420px]" aria-hidden>
          {HERO_BOOKS.map((book, i) => (
            <div
              key={book.product_id}
              className="absolute top-1/2 w-[44%] -translate-y-1/2 transition-transform duration-500 hover:-translate-y-[54%]"
              style={{
                left: `${6 + i * 25}%`,
                rotate: `${(i - 1) * 7}deg`,
                zIndex: i === 1 ? 3 : 2 - Math.abs(i - 1),
                marginTop: i === 1 ? -18 : 12,
              }}
            >
              <BookCover product={book} />
            </div>
          ))}
          <div className="absolute inset-x-6 bottom-2 h-3 rounded-[50%] bg-ink-900/15 blur-md" />
        </div>
      </section>

      <CategoryIndex />
      <Shelf title="Clássicos" eyebrow="Para começar" category="clássico" />
      <Featured />
      <Shelf title="Fantasia" eyebrow="Outros mundos" category="fantasia" />
      <Shelf title="Tecnologia" eyebrow="Para quem constrói software" category="tecnologia" />
      <HowItWorks />
    </>
  )
}

function CategoryIndex() {
  const { data } = useAsync(() => catalog.categories(), [])
  if (!data) return null
  return (
    <section className="border-y border-line bg-paper-100/60">
      <ol className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((c, i) => (
          <li key={c.category} className="border-line [&:not(:last-child)]:border-r">
            <Link
              to={`/catalogo?categoria=${encodeURIComponent(c.category)}`}
              className="group flex h-full flex-col gap-1 px-5 py-5 transition-colors hover:bg-paper-50"
            >
              <span className="font-mono text-xs text-ink-400">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-display text-lg font-semibold group-hover:text-vermilion-600">
                {categoryLabel(c.category)}
              </span>
              <span className="text-xs text-ink-500">{c.count} títulos</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Shelf({ title, eyebrow, category }: { title: string; eyebrow: string; category: string }) {
  const { data, error, loading, reload } = useAsync(() => catalog.list({ category, limit: 6 }), [category])
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-1.5 text-3xl font-semibold">{title}</h2>
        </div>
        <Link
          to={`/catalogo?categoria=${encodeURIComponent(category)}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-vermilion-600 hover:underline"
        >
          Ver estante <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
      {error ? (
        <div className="mt-8">
          <ErrorState onRetry={reload} />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {loading || !data
            ? Array.from({ length: 6 }, (_, i) => <BookCardSkeleton key={i} />)
            : data.products.map((p) => <BookCard key={p.product_id} product={p} />)}
        </div>
      )}
    </section>
  )
}

function Featured() {
  const { send } = useChat()
  const { data } = useAsync(() => catalog.get(FEATURED_ID, 0), [])
  if (!data) return null
  return (
    <section className="mt-24 bg-ink-900 text-paper-50">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[280px_1fr] md:gap-16">
        <BookCover product={data} className="mx-auto w-48 md:w-full" />
        <div>
          <p className="eyebrow !text-vermilion-100">Em destaque</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">{data.title}</h2>
          <p className="mt-2 text-paper-300">
            {data.author}
            {data.original_year ? `, ${data.original_year}` : ''}
          </p>
          <p className="mt-6 max-w-2xl font-display text-xl italic leading-relaxed text-paper-100">
            “{data.tagline}”
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-paper-300">{data.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="btn-accent"
              onClick={() => send(`Quero saber mais sobre ${data.title}`, { type: 'select_product', product_id: data.product_id })}
            >
              <ChatCircleText size={18} weight="fill" /> Perguntar ao livreiro
            </button>
            <Link to={`/livro/${data.product_id}`} className="text-sm font-semibold underline-offset-4 hover:underline">
              {data.price} · ver detalhes
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    ['Converse', 'Peça por título, autor ou só pelo assunto. A busca entende o que você quis dizer.'],
    ['Cote', 'O livreiro monta a cotação com o preço do catálogo e aplica o desconto que a casa permite.'],
    ['Confirme', 'Com a sua conta, o pedido é registrado e o estoque, reservado em poucos segundos.'],
  ]
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
      <p className="eyebrow">Como funciona</p>
      <ol className="mt-6 grid gap-8 md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={title} className="border-t-2 border-ink-900 pt-5">
            <span className="font-display text-5xl font-light italic text-vermilion-500">{i + 1}</span>
            <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-700">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
