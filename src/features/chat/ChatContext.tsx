import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { ApiError, chat } from '@/api/client'
import { useAuth } from '@/features/auth/AuthContext'
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
  openConversation: (id: string) => Promise<void>
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
  const { user, loading: authLoading } = useAuth()
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
  // Trocar de conversa invalida respostas que ainda estavam a caminho.
  const loadRef = useRef(0)

  const loadStart = useCallback(async () => {
    const load = ++loadRef.current
    const fresh = await chat.start('nova').catch(() => null)
    if (load === loadRef.current && fresh) {
      setSuggestions(fresh.suggestions)
      setInputHint(fresh.input_hint)
    }
  }, [])

  const loadHistory = useCallback(
    async (id: string) => {
      const load = ++loadRef.current
      setRestoring(true)
      try {
        const history = await chat.history(id)
        if (load !== loadRef.current) return
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
        // A conversa é de outra conta, a sessão expirou ou ela nunca existiu.
        if (load === loadRef.current && error instanceof ApiError && error.status === 404) {
          storeId(null)
          conversationRef.current = null
          setConversationId(null)
          setMessages([GREETING])
          await loadStart()
        }
      } finally {
        if (load === loadRef.current) setRestoring(false)
      }
    },
    [loadStart],
  )

  // Restaura a conversa salva (ou busca as sugestões iniciais).
  useEffect(() => {
    const id = conversationRef.current
    if (id) loadHistory(id)
    else loadStart()
  }, [loadHistory, loadStart])

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
              login_required: response.login_required,
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
    setSuggestions([])
    setStage('idle')
    loadStart()
  }, [loadStart])

  const openConversation = useCallback(
    async (id: string) => {
      storeId(id)
      conversationRef.current = id
      setConversationId(id)
      setMessages([GREETING])
      setSuggestions([])
      setOpen(true)
      await loadHistory(id)
    },
    [loadHistory],
  )

  // Ao sair da conta, a conversa dela não pode continuar na tela.
  const previousUser = useRef<string | null>(null)
  useEffect(() => {
    if (authLoading) return
    const current = user?.user_id ?? null
    if (previousUser.current && previousUser.current !== current) newConversation()
    previousUser.current = current
  }, [authLoading, user, newConversation])

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
      openConversation,
    }),
    [
      open,
      messages,
      suggestions,
      inputHint,
      stage,
      sending,
      restoring,
      conversationId,
      send,
      retry,
      newConversation,
      openConversation,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatState {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat precisa estar dentro de <ChatProvider>')
  return value
}
