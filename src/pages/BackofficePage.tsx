import { useState } from 'react'
import { ArrowClockwise, Warning } from '@phosphor-icons/react'

import { backoffice } from '@/api/client'
import { ErrorState } from '@/components/ErrorState'
import { StatusPill } from '@/features/chat/ChatCards'
import { formatDateTime, shortOrderId } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { OrderStatus } from '@/types/api'

const PAGE = 50
const STATUSES: [OrderStatus | '', string][] = [
  ['', 'Todos'],
  ['PENDING', 'Em processamento'],
  ['CONFIRMED', 'Confirmados'],
  ['REJECTED', 'Rejeitados'],
]

function Stat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-lg border border-line px-4 py-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className={`mt-0.5 font-display text-2xl font-semibold ${alert ? 'text-vermilion-600' : ''}`}>{value}</p>
    </div>
  )
}

function StockTab() {
  const { data, error, loading, reload } = useAsync(() => backoffice.stock(), [])
  if (error) return <ErrorState message="O estoque não carregou." onRetry={reload} />
  if (!data) return <p className="text-sm text-ink-400">Carregando…</p>
  const { summary, items } = data

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Títulos" value={summary.titles} />
        <Stat label="Exemplares em estoque" value={summary.units} />
        <Stat label="Títulos esgotados" value={summary.out_of_stock} alert={summary.out_of_stock > 0} />
        <Stat label="Exemplares vendidos" value={summary.sold} />
      </div>

      {summary.ledger_mismatches > 0 && (
        <p role="alert" className="mt-4 flex gap-2 rounded-lg bg-vermilion-50 px-3 py-2.5 text-sm text-vermilion-700">
          <Warning size={18} className="mt-0.5 shrink-0" />
          {summary.ledger_mismatches} título(s) com estoque diferente do livro-razão. Veja a coluna Conferência.
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={reload} disabled={loading} className="btn-ghost !px-3 !py-1.5">
          <ArrowClockwise size={15} weight="bold" /> Atualizar
        </button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper-100 text-xs text-ink-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Livro</th>
              <th className="px-3 py-2.5 font-semibold">Preço</th>
              <th className="px-3 py-2.5 text-right font-semibold">Estoque</th>
              <th className="px-3 py-2.5 text-right font-semibold">Vendidos</th>
              <th className="px-3 py-2.5 font-semibold">Conferência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.product_id}>
                <td className="px-3 py-2.5">
                  <span className="font-medium">{item.title}</span>
                  <span className="block text-xs text-ink-500">
                    {item.author} · {item.product_id}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{item.price}</td>
                <td className={`px-3 py-2.5 text-right font-mono ${item.stock === 0 ? 'font-semibold text-vermilion-600' : ''}`}>
                  {item.stock}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">{item.sold}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                  {item.ledger_ok ? (
                    <span className="text-moss-600">Confere</span>
                  ) : (
                    <span className="font-semibold text-vermilion-600">Livro-razão: {item.ledger_stock}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function OrdersTab() {
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [limit, setLimit] = useState(PAGE)
  const { data, error, loading, reload } = useAsync(
    () => backoffice.orders({ status: status || undefined, limit }),
    [status, limit],
  )

  function pick(next: OrderStatus | '') {
    setStatus(next)
    setLimit(PAGE)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map(([value, label]) => {
          const count = value ? (data?.by_status[value] ?? 0) : undefined
          return (
            <button
              key={label}
              type="button"
              onClick={() => pick(value)}
              aria-pressed={status === value}
              className={`chip ${status === value ? '!border-ink-900 !bg-ink-900 !text-paper-50' : ''}`}
            >
              {label}
              {count !== undefined && ` (${count})`}
            </button>
          )
        })}
        <button type="button" onClick={reload} disabled={loading} className="btn-ghost ml-auto !px-3 !py-1.5">
          <ArrowClockwise size={15} weight="bold" /> Atualizar
        </button>
      </div>

      <div className="mt-4">
        {error && <ErrorState message="Os pedidos não carregaram." onRetry={reload} />}
        {!data && !error && <p className="text-sm text-ink-400">Carregando…</p>}
        {data?.orders.length === 0 && <p className="py-10 text-center text-sm text-ink-500">Nenhum pedido aqui.</p>}
        {data && data.orders.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-paper-100 text-xs text-ink-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Pedido</th>
                  <th className="px-3 py-2.5 font-semibold">Cliente</th>
                  <th className="px-3 py-2.5 font-semibold">Itens</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.orders.map((order) => (
                  <tr key={order.order_id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="font-mono font-semibold">#{shortOrderId(order.order_id)}</span>
                      <span className="block text-xs text-ink-500">{formatDateTime(order.created_at)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {order.customer_name}
                      <span className="block text-xs text-ink-500">{order.account_email ?? 'Sem conta'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {order.items.map((item) => (
                        <span key={item.product_id} className="block">
                          {item.quantity}× {item.title}
                        </span>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">{order.total}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={order.status} />
                      {order.reason && <span className="mt-1 block text-xs text-ink-500">{order.reason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.orders.length < data.total && limit < 100 && (
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setLimit(100)} disabled={loading} className="btn-ghost">
              Mostrar mais
            </button>
          </div>
        )}
        {data && data.orders.length < data.total && limit >= 100 && (
          <p className="mt-3 text-center text-xs text-ink-500">
            Mostrando os {data.orders.length} mais recentes de {data.total}.
          </p>
        )}
      </div>
    </>
  )
}

export function BackofficePage() {
  const [tab, setTab] = useState<'stock' | 'orders'>('stock')
  const tabs: ['stock' | 'orders', string][] = [
    ['stock', 'Estoque'],
    ['orders', 'Pedidos'],
  ]

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Gestão</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Estoque e pedidos</h1>

      <div role="tablist" aria-label="Áreas da gestão" className="mt-6 flex gap-6 border-b border-line text-sm">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 pb-2 font-medium transition-colors ${
              tab === value ? 'border-vermilion-500 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === 'stock' ? <StockTab /> : <OrdersTab />}</div>
    </section>
  )
}
