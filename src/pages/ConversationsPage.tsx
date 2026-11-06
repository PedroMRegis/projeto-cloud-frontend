import { ChatCircleText } from '@phosphor-icons/react'

import { account } from '@/api/client'
import { ErrorState } from '@/components/ErrorState'
import { useChat } from '@/features/chat/ChatContext'
import { formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

export function ConversationsPage() {
  const { data, error, loading, reload } = useAsync(() => account.conversations(), [])
  const { conversationId, openConversation, newConversation, openChat } = useChat()

  function startNew() {
    newConversation()
    openChat()
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Sua conta</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Minhas conversas</h1>
        </div>
        <button type="button" onClick={startNew} className="btn-ghost shrink-0">
          Nova conversa
        </button>
      </div>

      <div className="mt-7">
        {error && <ErrorState message="Suas conversas não carregaram." onRetry={reload} />}
        {loading && !data && <p className="text-sm text-ink-400">Carregando…</p>}
        {data?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
            <ChatCircleText size={32} className="text-ink-400" />
            <p className="font-display text-lg font-semibold">Nenhuma conversa ainda</p>
            <p className="text-sm text-ink-500">Fale com o livreiro e a conversa fica guardada aqui.</p>
          </div>
        )}
        <ul className="divide-y divide-line">
          {data?.map((item) => (
            <li key={item.conversation_id}>
              <button
                type="button"
                onClick={() => openConversation(item.conversation_id)}
                className="block w-full px-1 py-4 text-left transition-colors hover:bg-paper-100"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="truncate font-semibold">{item.title}</span>
                  <span className="shrink-0 text-xs text-ink-400">{formatDateTime(item.updated_at)}</span>
                </span>
                <span className="mt-1 line-clamp-2 block text-sm text-ink-500">{item.last_message}</span>
                {item.conversation_id === conversationId && (
                  <span className="mt-1.5 block text-xs font-semibold text-vermilion-600">Conversa aberta</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
