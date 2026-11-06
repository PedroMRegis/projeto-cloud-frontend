// Contratos das APIs. O backend-api responde por catálogo, cotação e pedido;
// o chatbot por conversa. Os tipos espelham as respostas JSON de cada um.

export interface Product {
  product_id: string
  title: string
  author: string
  category: string
  tagline: string
  description: string
  original_year: number | null
  price_cents: number
  price: string
  stock: number
  in_stock: boolean
  related?: Product[]
}

export interface ProductList {
  total?: number
  count: number
  mode?: 'list' | 'lexical' | 'hybrid'
  products: Product[]
}

export interface Category {
  category: string
  count: number
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

export interface OrderHistoryEntry {
  status: OrderStatus
  reason: string | null
  by: string
  at: string
}

export interface Order {
  order_id: string
  status: OrderStatus
  customer_name: string
  items: { product_id: string; title: string; author?: string; quantity: number; unit_price: string }[]
  subtotal: string
  discount_pct: number
  total: string
  total_cents: number
  created_at: string
  updated_at: string
  history: OrderHistoryEntry[]
  reason?: string
  explanation?: string
}

// ---------------------------------------------------------------- chatbot

/** Livro como aparece no chat: sem a sinopse longa. */
export interface ProductCard {
  product_id: string
  title: string
  author: string
  category: string
  tagline: string
  original_year: number | null
  price: string
  price_cents: number
  stock: number
  in_stock: boolean
}

export interface QuoteCard {
  quote_id: string
  items: { product_id: string; title: string; quantity: number; unit_price: string }[]
  subtotal: string
  discount_pct: number
  max_discount_pct: number
  total: string
  total_cents: number
  note?: string | null
  expires_at: string
}

export interface OrderCard {
  order_id: string
  status: OrderStatus
  total: string
  items: { product_id: string; title: string; quantity: number }[]
  reason?: string | null
  explanation?: string | null
}

export type ChatActionType =
  | 'select_product'
  | 'set_quantity'
  | 'change_quantity'
  | 'request_discount'
  | 'confirm'
  | 'details'
  | 'order_status'
  | 'browse_category'
  | 'search'
  | 'surprise'
  | 'back'
  | 'cancel'
  | 'reset'

export interface ChatAction {
  type: ChatActionType
  product_id?: string
  quantity?: number
  discount_pct?: number
  category?: string
  query?: string
}

export interface Suggestion {
  label: string
  message: string
  action?: ChatAction
}

export type Stage = 'idle' | 'browsing' | 'product' | 'quoted' | 'ordered'

export interface TurnUI {
  products: ProductCard[]
  quote: QuoteCard | null
  order: OrderCard | null
  suggestions: Suggestion[]
  input_hint: string
  stage: Stage
  login_required?: boolean
}

export interface ChatResponse extends TurnUI {
  conversation_id: string
  reply: string
  actions: { tool: string; args: Record<string, unknown>; result_summary: string }[]
  order_id: string | null
  degraded: boolean
  replayed: boolean
}

export type Role = 'customer' | 'admin'

export interface User {
  user_id: string
  email: string
  name: string
  role: Role
}

export interface ConversationSummary {
  conversation_id: string
  title: string
  last_message: string
  stage: Stage
  created_at: string
  updated_at: string
}

export interface StockItem {
  product_id: string
  title: string
  author: string
  category: string
  price: string
  stock: number
  ledger_stock: number
  sold: number
  ledger_ok: boolean
}

export interface StockReport {
  items: StockItem[]
  summary: { titles: number; units: number; out_of_stock: number; sold: number; ledger_mismatches: number }
}

export interface BackofficeOrder extends Omit<Order, 'reason'> {
  account_email: string | null
  reason: string | null
}

export interface BackofficeOrders {
  orders: BackofficeOrder[]
  by_status: Partial<Record<OrderStatus, number>>
  total: number
}

export interface ConversationHistory {
  conversation_id: string
  messages: { role: 'user' | 'assistant'; content: string; at: string; ui?: TurnUI }[]
  stage: Stage
  order: OrderCard | null
  suggestions: Suggestion[]
  input_hint: string
}
