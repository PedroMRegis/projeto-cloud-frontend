import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { ApiError, chat } from '@/api/client'
import { newRequestId } from '@/lib/format'
import type { ChatAction, Stage, Suggestion, TurnUI } from '@/types/api'

/*
 * Estado da conversa com o livreiro, compartilhado pelo site inteiro: a página
 * de um livro pode abrir o chat já com o livro escolhido.
 *
 * Confiabilidade do envio:
 * - cada mensagem tem um request_id gerado aqui; "tentar de novo" reenvia com
 *   o MESMO id, então o chatbot devolve a resposta guardada em vez de
 *   processar (e eventualmente registrar um pedido) duas vezes;
 * - 409 (mesmo id ainda em processamento) é tratado como "aguarde e repita".
 */

const STORAGE_KEY = 'cirro.conversation'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ui?: TurnUI
  degraded?: boolean
  status?: 'sending' | 'failed'
  error?: string
  retry?: { message: string; request_id: string; action?: ChatAction }
}

interface ChatState {
  open: boolean
  messages: ChatMessage[]
  suggestions: Suggestion[]
  inputHint: string
  stage: Stage
  sending: boolean
  restoring: boolean
  conversationId: string | null
  openChat: () => void
  closeChat: () => void
  send: (message: string, action?: ChatAction) => Promise<void>
  retry: (messageId: string) => Promise<void>
  newConversation: () => void
}

const ChatContext = createContext<ChatState | null>(null)

// `?conversa=<id>` retoma uma conversa específica (útil em demo, para mostrar
// a mesma conversa em outro navegador); `?chat` abre o painel ao carregar.
const params = new URLSearchParams(window.location.search)

function readStoredId(): string | null {
  const fromUrl = params.get('conversa')
  if (fromUrl) return fromUrl
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* modo privado: a conversa só não sobrevive ao reload */
  }
}

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    'Olá! Sou o livreiro da Cirro. Me diga um título, um autor ou só um assunto — ' +
    '"um romance brasileiro", "algo sobre hábitos" — e eu encontro, faço a cotação e registro o pedido.',
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(params.has('chat') || params.has('conversa'))
  const [conversationId, setConversationId] = useState<string | null>(readStoredId)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [inputHint, setInputHint] = useState('Pergunte por título, autor ou assunto')
  const [stage, setStage] = useState<Stage>('idle')
  const [sending, setSending] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const conversationRef = useRef(conversationId)
  conversationRef.current = conversationId

  // Restaura a conversa salva (ou busca as sugestões iniciais).
  useEffect(() => {
    let cancelled = false
    const id = conversationRef.current
    async function restore() {
      if (!id) {
        const fresh = await chat.start('nova').catch(() => null)
        if (!cancelled && fresh) {
          setSuggestions(fresh.suggestions)
          setInputHint(fresh.input_hint)
        }
        return
      }
      setRestoring(true)
      try {
        const history = await chat.history(id)
        if (cancelled) return
        setMessages([
          GREETING,
          ...history.messages.map((m, i) => ({
            id: `h-${i}`,
            role: m.role,
            content: m.content,
            ui: m.ui,
          })),
        ])
        setSuggestions(history.suggestions)
        setInputHint(history.input_hint)
        setStage(history.stage)
      } catch (error) {
        // Conversa expirou (TTL de 7 dias) ou nunca existiu: recomeça.
        if (error instanceof ApiError && error.status === 404) {
          storeId(null)
          setConversationId(null)
          const fresh = await chat.start('nova').catch(() => null)
          if (!cancelled && fresh) setSuggestions(fresh.suggestions)
        }
      } finally {
        if (!cancelled) setRestoring(false)
      }
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const deliver = useCallback(
    async (userMessageId: string, payload: { message: string; request_id: string; action?: ChatAction }) => {
      setSending(true)
      try {
        let response
        for (let attempt = 0; ; attempt++) {
          try {
            response = await chat.send({ ...payload, conversation_id: conversationRef.current })
            break
          } catch (error) {
            // 409: o mesmo request_id ainda está em processamento. Espera e repete.
            if (error instanceof ApiError && error.status === 409 && attempt < 5) {
              await new Promise((r) => setTimeout(r, 800))
              continue
            }
            throw error
          }
        }
        if (!conversationRef.current) {
          conversationRef.current = response.conversation_id
          setConversationId(response.conversation_id)
          storeId(response.conversation_id)
        }
        setMessages((current) => [
          ...current.map((m) =>
            m.id === userMessageId ? { ...m, status: undefined, error: undefined, retry: undefined } : m,
          ),
          {
            id: `a-${payload.request_id}`,
            role: 'assistant',
            content: response.reply,
            degraded: response.degraded,
            ui: {
              products: response.products,
              quote: response.quote,
              order: response.order,
              suggestions: response.suggestions,
              input_hint: response.input_hint,
              stage: response.stage,
            },
          },
        ])
        setSuggestions(response.suggestions)
        setInputHint(response.input_hint)
        setStage(response.stage)
      } catch (error) {
        const reason =
          error instanceof ApiError && error.status === 429
            ? 'Muitas mensagens seguidas. Espere um instante.'
            : 'Não foi possível enviar.'
        setMessages((current) =>
          current.map((m) =>
            m.id === userMessageId ? { ...m, status: 'failed', error: reason, retry: payload } : m,
          ),
        )
      } finally {
        setSending(false)
      }
    },
    [],
  )

  const send = useCallback(
    async (message: string, action?: ChatAction) => {
      const text = message.trim()
      if (!text || sending) return
      const request_id = newRequestId()
      const id = `u-${request_id}`
      setOpen(true)
      setSuggestions([])
      setMessages((current) => [...current, { id, role: 'user', content: text, status: 'sending' }])
      await deliver(id, { message: text, request_id, action })
    },
    [deliver, sending],
  )

  const retry = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId)
      if (!target?.retry || sending) return
      setMessages((current) => current.map((m) => (m.id === messageId ? { ...m, status: 'sending' } : m)))
      await deliver(messageId, target.retry)
    },
    [deliver, messages, sending],
  )

  const newConversation = useCallback(() => {
    storeId(null)
    conversationRef.current = null
    setConversationId(null)
    setMessages([GREETING])
    setStage('idle')
    chat
      .start('nova')
      .then((fresh) => {
        setSuggestions(fresh.suggestions)
        setInputHint(fresh.input_hint)
      })
      .catch(() => setSuggestions([]))
  }, [])

  const value = useMemo<ChatState>(
    () => ({
      open,
      messages,
      suggestions,
      inputHint,
      stage,
      sending,
      restoring,
      conversationId,
      openChat: () => setOpen(true),
      closeChat: () => setOpen(false),
      send,
      retry,
      newConversation,
    }),
    [open, messages, suggestions, inputHint, stage, sending, restoring, conversationId, send, retry, newConversation],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatState {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat precisa estar dentro de <ChatProvider>')
  return value
}
