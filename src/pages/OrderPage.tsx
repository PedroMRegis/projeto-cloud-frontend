import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import { ApiError, orders } from '@/api/client'
import { BookCover } from '@/components/BookCover'
import { ErrorState } from '@/components/ErrorState'
import { StatusPill } from '@/features/chat/ChatCards'
import { useChat } from '@/features/chat/ChatContext'
import { formatDateTime, shortOrderId } from '@/lib/format'
import type { Order } from '@/types/api'

import { NotFound } from './NotFound'

const STEP_LABEL: Record<string, string> = {
  PENDING: 'Pedido registrado',
  CONFIRMED: 'Estoque confirmado',
  REJECTED: 'Pedido não confirmado',
}

const ACTOR_LABEL: Record<string, string> = {
  'backend-api': 'loja',
  'order-worker': 'processamento de pedidos',
}

/**
 * Acompanha o pedido. Enquanto estiver PENDING, consulta a cada 2 s: é aqui
 * que se vê o caminho assíncrono (outbox → SQS → order-worker) acontecer.
 */
export function OrderPage() {
  const { id = '' } = useParams()
  const { conversationId } = useChat()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const fresh = await orders.get(id, conversationId)
        if (!active) return
        setOrder(fresh)
        setError(null)
        if (fresh.status === 'PENDING') timer = setTimeout(poll, 2000)
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err : new ApiError(0, 'Falha ao consultar'))
      }
    }
    poll()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [id, conversationId, nonce])

  if (error?.status === 404 || error?.status === 403) return <NotFound what="pedido" />
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 pt-16">
        <ErrorState message={error.message} onRetry={() => setNonce((n) => n + 1)} />
      </div>
    )
  if (!order) return <p className="px-4 pt-20 text-center text-sm text-ink-500">Carregando o pedido…</p>

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Voltar à livraria
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Pedido</p>
          <h1 className="mt-2 font-mono text-4xl font-semibold tracking-tight">nº {shortOrderId(order.order_id)}</h1>
          <p className="mt-1 text-sm text-ink-500">
            Em nome de {order.customer_name} · {formatDateTime(order.created_at)}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      {order.status === 'REJECTED' && order.explanation && (
        <p className="mt-6 rounded-lg bg-vermilion-50 px-4 py-3 text-sm text-vermilion-700">
          {order.explanation} Nenhum valor foi cobrado e o estoque não foi alterado.
        </p>
      )}

      <section className="mt-8">
        <h2 className="eyebrow">Linha do tempo</h2>
        <ol className="mt-4 space-y-0">
          {order.history.map((step, i) => (
            <li key={`${step.status}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
              <span
                className={`relative z-10 mt-1 size-3 shrink-0 rounded-full ring-4 ring-paper-50 ${
                  step.status === 'CONFIRMED'
                    ? 'bg-moss-600'
                    : step.status === 'REJECTED'
                      ? 'bg-vermilion-500'
                      : 'bg-amber-600'
                }`}
              />
              {i < order.history.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-line" />}
              <div>
                <p className="font-semibold">{STEP_LABEL[step.status] ?? step.status}</p>
                <p className="text-xs text-ink-500">
                  {formatDateTime(step.at)} · {ACTOR_LABEL[step.by] ?? step.by}
                </p>
              </div>
            </li>
          ))}
          {order.status === 'PENDING' && (
            <li className="flex gap-4 pt-6 text-sm text-ink-500">
              <span className="mt-1.5 size-3 shrink-0 animate-pulse rounded-full border-2 border-amber-600" />
              Confirmando o estoque… esta página se atualiza sozinha.
            </li>
          )}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-line">
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-4 p-4">
              <BookCover product={{ ...item, author: item.author ?? '' }} className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <Link to={`/livro/${item.product_id}`} className="font-display font-semibold hover:text-vermilion-600">
                  {item.title}
                </Link>
                <p className="text-xs text-ink-500">{item.author}</p>
              </div>
              <p className="font-mono text-sm">
                {item.quantity} × {item.unit_price}
              </p>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-line bg-paper-100/60 p-4 font-mono text-sm">
          <div className="flex justify-between text-ink-500">
            <span>Subtotal</span>
            <span>{order.subtotal}</span>
          </div>
          {order.discount_pct > 0 && (
            <div className="flex justify-between text-vermilion-600">
              <span>Desconto</span>
              <span>−{order.discount_pct}%</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{order.total}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
