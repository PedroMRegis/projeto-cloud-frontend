import { Link } from 'react-router-dom'
import { Package } from '@phosphor-icons/react'

import { account } from '@/api/client'
import { ErrorState } from '@/components/ErrorState'
import { StatusPill } from '@/features/chat/ChatCards'
import { formatDateTime, shortOrderId } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

export function MyOrdersPage() {
  const { data, error, loading, reload } = useAsync(() => account.orders(), [])

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Sua conta</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Meus pedidos</h1>

      <div className="mt-7">
        {error && <ErrorState message="Seus pedidos não carregaram." onRetry={reload} />}
        {loading && !data && <p className="text-sm text-ink-400">Carregando…</p>}
        {data?.orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
            <Package size={32} className="text-ink-400" />
            <p className="font-display text-lg font-semibold">Nenhum pedido ainda</p>
            <p className="text-sm text-ink-500">Os pedidos feitos com login aparecem aqui.</p>
          </div>
        )}
        <ul className="divide-y divide-line">
          {data?.orders.map((order) => (
            <li key={order.order_id}>
              <Link to={`/pedido/${order.order_id}`} className="block px-1 py-4 transition-colors hover:bg-paper-100">
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-sm font-semibold">#{shortOrderId(order.order_id)}</span>
                  <StatusPill status={order.status} />
                </span>
                <span className="mt-1.5 block text-sm text-ink-700">
                  {order.items.map((item) => `${item.quantity}× ${item.title}`).join(' · ')}
                </span>
                <span className="mt-1 flex justify-between text-xs text-ink-500">
                  <span>{formatDateTime(order.created_at)}</span>
                  <strong className="text-ink-900">{order.total}</strong>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
