import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowClockwise, ArrowUp, NotePencil, Warning, X } from '@phosphor-icons/react'

import { useChat } from './ChatContext'
import type { ChatMessage } from './ChatContext'
import { OrderTicket, ProductStrip, QuoteReceipt } from './ChatCards'

/**
 * O balcão do livreiro: painel lateral no desktop, tela cheia no celular.
 * As sugestões da etapa atual ficam acima do campo de texto — o cliente pode
 * comprar só clicando, mas digitar continua valendo.
 */
export function ChatPanel() {
  const { open, closeChat, messages, suggestions, inputHint, send, sending, restoring, newConversation } =
    useChat()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) closeChat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeChat])

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!draft.trim() || sending) return
    send(draft)
    setDraft('')
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')

  return (
    <>
      <div
        aria-hidden
        onClick={closeChat}
        className={`fixed inset-0 z-40 bg-ink-900/25 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Conversa com o livreiro"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-paper-50 transition-transform duration-300 ease-out sm:w-[420px] sm:border-l sm:border-line ${
          open ? 'translate-x-0 shadow-panel' : 'pointer-events-none invisible translate-x-full'
        }`}
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="relative grid size-10 place-items-center rounded-full bg-ink-900 font-display text-lg font-semibold text-paper-50">
            C
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-paper-50 bg-moss-600" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold leading-none">O livreiro</p>
            <p className="mt-1 text-xs text-ink-500">Busca, cotação e pedido numa conversa</p>
          </div>
          <button
            type="button"
            onClick={newConversation}
            className="rounded-full p-2 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900"
            title="Nova conversa"
            aria-label="Nova conversa"
          >
            <NotePencil size={19} />
          </button>
          <button
            type="button"
            onClick={closeChat}
            className="rounded-full p-2 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900"
            aria-label="Fechar conversa"
          >
            <X size={19} />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {restoring && <p className="text-center text-xs text-ink-400">Recuperando a conversa…</p>}
          {messages.map((message) => (
            <Message key={message.id} message={message} latest={message === lastAssistant} />
          ))}
          {sending && <Typing />}
        </div>

        <div className="border-t border-line bg-paper-50 px-4 pb-4 pt-3">
          {suggestions.length > 0 && !sending && (
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Respostas rápidas">
              {suggestions.map((s) => (
                <button key={s.label} type="button" className="chip animate-rise" onClick={() => send(s.message, s.action)}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit} className="flex items-end gap-2 rounded-2xl border border-ink-900/15 bg-paper-50 p-1.5 focus-within:border-ink-900">
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={inputHint}
              aria-label="Mensagem para o livreiro"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900 text-paper-50 transition-colors hover:bg-vermilion-600 disabled:bg-ink-400"
              aria-label="Enviar"
            >
              <ArrowUp size={18} weight="bold" />
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function Message({ message, latest }: { message: ChatMessage; latest: boolean }) {
  const { retry, sending } = useChat()

  if (message.role === 'user') {
    return (
      <div className="flex animate-rise flex-col items-end">
        <p
          className={`max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm px-4 py-2.5 text-sm ${
            message.status === 'failed' ? 'bg-vermilion-50 text-vermilion-700' : 'bg-ink-900 text-paper-50'
          } ${message.status === 'sending' ? 'opacity-70' : ''}`}
        >
          {message.content}
        </p>
        {message.status === 'failed' && (
          <button
            type="button"
            disabled={sending}
            onClick={() => retry(message.id)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-vermilion-600 hover:underline"
          >
            <ArrowClockwise size={12} weight="bold" /> {message.error} Tentar de novo
          </button>
        )}
      </div>
    )
  }

  const ui = message.ui
  return (
    <div className="flex max-w-[92%] animate-rise flex-col gap-2.5">
      <p
        className={`whitespace-pre-line text-[0.92rem] leading-relaxed ${
          message.degraded ? 'flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-600' : 'text-ink-800'
        }`}
      >
        {message.degraded && <Warning size={18} className="mt-0.5 shrink-0" />}
        <span>{message.content}</span>
      </p>
      {ui && ui.products.length > 0 && <ProductStrip products={ui.products} interactive={latest} />}
      {ui?.quote && !ui.order && <QuoteReceipt quote={ui.quote} />}
      {ui?.order && <OrderTicket order={ui.order} live={latest} />}
    </div>
  )
}

function Typing() {
  return (
    <div className="flex items-center gap-1.5 text-ink-400" aria-label="O livreiro está digitando">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-blink rounded-full bg-current" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  )
}
