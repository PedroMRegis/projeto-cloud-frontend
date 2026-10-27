import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Clock, XCircle } from '@phosphor-icons/react'

import { orders } from '@/api/client'
import { BookCover } from '@/components/BookCover'
import { shortOrderId, stockLabel } from '@/lib/format'
import type { OrderCard, OrderStatus, ProductCard, QuoteCard } from '@/types/api'

import { useChat } from './ChatContext'

/** Um livro em destaque, ou uma prateleira rolável quando são vários. */
export function ProductStrip({ products, interactive }: { products: ProductCard[]; interactive: boolean }) {
  const { send, sending } = useChat()

  if (products.length === 1) {
    const p = products[0]
    const stock = stockLabel(p.stock)
    return (
      <div className="flex gap-3 rounded-lg border border-line bg-paper-50 p-3">
        <BookCover product={p} className="w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.95rem] font-semibold leading-tight">{p.title}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {p.author}
            {p.original_year ? ` · ${p.original_year}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-semibold text-ink-900">{p.price}</span>
            <span
              className={
                stock.tone === 'out'
                  ? 'text-vermilion-600'
                  : stock.tone === 'low'
                    ? 'text-amber-600'
                    : 'text-moss-600'
              }
            >
              · {stock.text}
            </span>
          </div>
          <Link
            to={`/livro/${p.product_id}`}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-vermilion-600 hover:underline"
          >
            Página do livro <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
      {products.map((p) => (
        <button
          key={p.product_id}
          type="button"
          disabled={!interactive || sending}
          onClick={() => send(`Quero ver ${p.title}`, { type: 'select_product', product_id: p.product_id })}
          className="group w-24 shrink-0 snap-start text-left disabled:cursor-default"
        >
          <BookCover product={p} lift={interactive} />
          <p className="mt-1.5 line-clamp-2 text-[0.72rem] font-semibold leading-tight">{p.title}</p>
          <p className="text-[0.7rem] text-ink-500">{p.price}</p>
        </button>
      ))}
    </div>
  )
}

/** Cotação como recibo de balcão: números em mono, desconto destacado. */
export function QuoteReceipt({ quote }: { quote: QuoteCard }) {
  return (
    <div className="relative overflow-hidden rounded-t-md bg-paper-100 font-mono text-[0.78rem] text-ink-800">
      <div className="px-4 pb-3 pt-3.5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow !text-[0.62rem]">Cotação</span>
          <span className="text-[0.65rem] text-ink-500">válida por 30 min</span>
        </div>
        <ul className="mt-2.5 space-y-1">
          {quote.items.map((item) => (
            <li key={item.product_id} className="flex gap-2">
              <span className="shrink-0">{item.quantity}×</span>
              <span className="min-w-0 flex-1 truncate font-sans">{item.title}</span>
              <span className="shrink-0">{item.unit_price}</span>
            </li>
          ))}
        </ul>
        <div className="my-2.5 border-t border-dashed border-ink-400/60" />
        <div className="flex justify-between text-ink-500">
          <span>Subtotal</span>
          <span>{quote.subtotal}</span>
        </div>
        {quote.discount_pct > 0 && (
          <div className="flex justify-between text-vermilion-600">
            <span>Desconto</span>
            <span>−{quote.discount_pct}%</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-[0.95rem] font-semibold text-ink-900">
          <span>Total</span>
          <span>{quote.total}</span>
        </div>
        {quote.max_discount_pct > quote.discount_pct && (
          <p className="mt-2 font-sans text-[0.7rem] text-ink-500">
            Este carrinho permite até {quote.max_discount_pct}% de desconto.
          </p>
        )}
      </div>
      <div className="receipt-edge h-2 w-full" />
    </div>
  )
}

const STATUS_META: Record<OrderStatus, { label: string; tone: string; icon: typeof Clock }> = {
  PENDING: { label: 'Confirmando estoque', tone: 'bg-amber-50 text-amber-600', icon: Clock },
  CONFIRMED: { label: 'Confirmado', tone: 'bg-moss-50 text-moss-600', icon: CheckCircle },
  REJECTED: { label: 'Não confirmado', tone: 'bg-vermilion-50 text-vermilion-600', icon: XCircle },
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${meta.tone}`}>
      <Icon size={13} weight="bold" className={status === 'PENDING' ? 'animate-pulse' : ''} />
      {meta.label}
    </span>
  )
}

/**
 * Pedido no chat. Enquanto estiver PENDING, consulta o backend a cada 1,5 s:
 * o order-worker confirma de forma assíncrona (SQS), e o cliente vê a mudança
 * acontecer sem recarregar.
 */
export function OrderTicket({ order, live }: { order: OrderCard; live: boolean }) {
  const { conversationId } = useChat()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [explanation, setExplanation] = useState(order.explanation)

  useEffect(() => {
    if (!live || status !== 'PENDING') return
    let attempts = 0
    const timer = setInterval(async () => {
      attempts += 1
      try {
        const fresh = await orders.get(order.order_id, conversationId)
        setStatus(fresh.status)
        setExplanation(fresh.explanation)
        if (fresh.status !== 'PENDING') clearInterval(timer)
      } catch {
        /* tenta no próximo ciclo */
      }
      if (attempts >= 40) clearInterval(timer)
    }, 1500)
    return () => clearInterval(timer)
  }, [live, status, order.order_id, conversationId])

  return (
    <div className="rounded-lg border border-line bg-paper-50 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="eyebrow !text-[0.62rem]">Pedido</p>
          <p className="font-mono text-sm font-semibold">nº {shortOrderId(order.order_id)}</p>
        </div>
        <StatusPill status={status} />
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {order.items.map((i) => `${i.quantity}× ${i.title}`).join(' · ')} — <strong className="text-ink-900">{order.total}</strong>
      </p>
      {status === 'REJECTED' && explanation && <p className="mt-1.5 text-xs text-vermilion-600">{explanation}</p>}
      <Link
        to={`/pedido/${order.order_id}`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-vermilion-600 hover:underline"
      >
        Acompanhar pedido <ArrowRight size={12} weight="bold" />
      </Link>
    </div>
  )
}
