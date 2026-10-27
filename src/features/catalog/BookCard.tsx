import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { stockLabel } from '@/lib/format'
import type { Product } from '@/types/api'

export function BookCard({ product }: { product: Product }) {
  const stock = stockLabel(product.stock)
  return (
    <Link to={`/livro/${product.product_id}`} className="group flex flex-col">
      <div className="relative">
        <BookCover product={product} lift className={product.in_stock ? '' : 'grayscale-[0.6]'} />
        {stock.tone !== 'ok' && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
              stock.tone === 'out' ? 'bg-ink-900 text-paper-50' : 'bg-paper-50 text-vermilion-600'
            }`}
          >
            {stock.text}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-display text-[1.02rem] font-semibold leading-snug transition-colors group-hover:text-vermilion-600">
        {product.title}
      </h3>
      <p className="mt-0.5 text-sm text-ink-500">{product.author}</p>
      <p className="mt-1.5 text-sm font-semibold">{product.price}</p>
    </Link>
  )
}

export function BookCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-[3px] bg-paper-200" />
      <div className="mt-3 h-4 w-4/5 rounded bg-paper-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-paper-200" />
    </div>
  )
}
