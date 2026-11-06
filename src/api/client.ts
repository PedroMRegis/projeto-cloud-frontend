import type {
  BackofficeOrders,
  Category,
  ChatAction,
  ChatResponse,
  ConversationHistory,
  ConversationSummary,
  Order,
  Product,
  ProductList,
  StockReport,
  Suggestion,
  User,
} from '@/types/api'

// Caminhos relativos: em produção o ALB decide o serviço pelo prefixo
// (/api/chat* e /api/conversations* -> chatbot; /api/* -> backend).

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor.')
  }
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = typeof body.detail === 'string' ? body.detail : detail
    } catch {
      /* corpo não é JSON */
    }
    throw new ApiError(response.status, detail)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

// ------------------------------------------------------------- catálogo

export const catalog = {
  list: (params: { q?: string; category?: string; sort?: string; limit?: number; offset?: number }) =>
    request<ProductList>(`/api/products${query(params)}`),
  get: (id: string, related = 4) =>
    request<Product>(`/api/products/${encodeURIComponent(id)}${query({ related })}`),
  categories: () => request<{ categories: Category[] }>('/api/categories').then((r) => r.categories),
}

export const orders = {
  get: (id: string, conversationId?: string | null) =>
    request<Order>(`/api/orders/${encodeURIComponent(id)}${query({ conversation_id: conversationId })}`),
}

// --------------------------------------------------------------- conta

// A sessão vive num cookie HttpOnly: o JavaScript nunca toca no token.
export const auth = {
  me: () => request<User>('/api/auth/me'),
  login: (payload: { email: string; password: string }) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { name: string; email: string; password: string }) =>
    request<User>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
}

export const account = {
  orders: () => request<{ orders: Order[]; total: number }>('/api/me/orders'),
  conversations: () =>
    request<{ conversations: ConversationSummary[] }>('/api/conversations').then((r) => r.conversations),
}

export const backoffice = {
  stock: () => request<StockReport>('/api/backoffice/stock'),
  orders: (params: { status?: string; limit?: number; offset?: number }) =>
    request<BackofficeOrders>(`/api/backoffice/orders${query(params)}`),
}

// ---------------------------------------------------------------- chat

export const chat = {
  send: (payload: {
    message: string
    request_id: string
    conversation_id?: string | null
    action?: ChatAction
  }) => request<ChatResponse>('/api/chat', { method: 'POST', body: JSON.stringify(payload) }),
  history: (conversationId: string) =>
    request<ConversationHistory>(`/api/conversations/${encodeURIComponent(conversationId)}`),
  start: (conversationId: string) =>
    request<{ suggestions: Suggestion[]; input_hint: string }>(
      `/api/conversations/${encodeURIComponent(conversationId)}/start`,
      { method: 'POST' },
    ),
}
