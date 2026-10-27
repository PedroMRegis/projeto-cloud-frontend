export const CATEGORY_LABELS: Record<string, string> = {
  clássico: 'Clássicos',
  ficção: 'Ficção',
  fantasia: 'Fantasia',
  'não-ficção': 'Não-ficção',
  tecnologia: 'Tecnologia',
  infantil: 'Infantil',
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1)
}

export function shortOrderId(orderId: string): string {
  return orderId.split('-')[0].toUpperCase()
}

export function stockLabel(stock: number): { text: string; tone: 'ok' | 'low' | 'out' } {
  if (stock <= 0) return { text: 'Esgotado', tone: 'out' }
  if (stock <= 3) return { text: stock === 1 ? 'Último exemplar' : `Últimos ${stock}`, tone: 'low' }
  return { text: 'Em estoque', tone: 'ok' }
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * `crypto.randomUUID` só existe em contexto seguro (HTTPS ou localhost). Atrás
 * do ALB em HTTP puro ela some, então o fallback monta um UUID v4 na mão.
 */
export function newRequestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
