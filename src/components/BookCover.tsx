import type { CSSProperties } from 'react'

/*
 * Capa tipográfica gerada a partir do product_id.
 *
 * Não usamos imagens de capa reais (direitos autorais e dependência externa).
 * Cada livro recebe, de forma determinística, uma paleta e uma composição —
 * a mesma capa em todo lugar do site e do chat. O tamanho do texto acompanha
 * a largura da capa via container queries (cqw), então a mesma capa serve
 * para miniatura no chat e para destaque na página do livro.
 */

interface Palette {
  bg: string
  ink: string
  accent: string
}

const PALETTES: Palette[] = [
  { bg: '#b23a26', ink: '#fbf3ea', accent: '#f2c14e' },
  { bg: '#1f4e52', ink: '#f3ece0', accent: '#e0a96d' },
  { bg: '#d9a23f', ink: '#1b1a17', accent: '#8a2b1d' },
  { bg: '#1b1a17', ink: '#f4efe6', accent: '#d2553d' },
  { bg: '#a7b59a', ink: '#1f2a22', accent: '#6b2d22' },
  { bg: '#4b2c3f', ink: '#f4e6dc', accent: '#d98c6a' },
  { bg: '#ece2cf', ink: '#1b1a17', accent: '#2f5d50' },
  { bg: '#22304a', ink: '#efe6d4', accent: '#c9a24c' },
  { bg: '#d98b73', ink: '#2a1a14', accent: '#fbf3ea' },
]

type Layout = 'band' | 'circle' | 'stripes' | 'initial' | 'frame' | 'dots'
const LAYOUTS: Layout[] = ['band', 'circle', 'stripes', 'initial', 'frame', 'dots']

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function titleSize(title: string, layout: Layout): string {
  // No layout de listras o título ocupa só ~55% da largura.
  const room = layout === 'stripes' ? 0.62 : 1
  const longest = Math.max(...title.split(' ').map((w) => w.length))
  let size = 14.5
  if (title.length > 32 || longest > 12) size = 9.5
  else if (title.length > 18 || longest > 9) size = 12
  // Uma palavra longa não pode passar da largura disponível (~0,6 em por letra).
  size = Math.min(size * room, (82 * room) / (longest * 0.6))
  return `${size.toFixed(2)}cqw`
}

interface BookCoverProps {
  product: { product_id: string; title: string; author: string }
  className?: string
  /** Sombra e leve inclinação no hover, para prateleiras. */
  lift?: boolean
}

export function BookCover({ product, className = '', lift = false }: BookCoverProps) {
  const h = hash(product.product_id)
  const palette = PALETTES[h % PALETTES.length]
  const layout = LAYOUTS[(h >>> 4) % LAYOUTS.length]
  const style = {
    '--bg': palette.bg,
    '--ink': palette.ink,
    '--accent': palette.accent,
    containerType: 'inline-size',
  } as CSSProperties

  return (
    <div
      role="img"
      aria-label={`Capa de ${product.title}, de ${product.author}`}
      style={style}
      className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-[var(--bg)] text-[var(--ink)] shadow-book
        ${lift ? 'transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:-rotate-1' : ''}
        ${className}`}
    >
      <Art layout={layout} title={product.title} />

      <div
        className={`absolute inset-x-[9%] flex flex-col gap-[3cqw] ${
          layout === 'circle' || layout === 'initial' ? 'bottom-[9%]' : 'top-[11%]'
        } ${layout === 'stripes' ? 'left-[38%]' : ''}`}
      >
        <p
          className="font-display font-semibold leading-[0.98] text-balance"
          style={{ fontSize: titleSize(product.title, layout), fontVariationSettings: '"SOFT" 60, "WONK" 1' }}
        >
          {product.title}
        </p>
        {layout !== 'circle' && layout !== 'initial' && (
          <span className="block h-[1.2cqw] w-[18cqw] bg-[var(--accent)]" />
        )}
      </div>

      <p
        className={`absolute inset-x-[9%] text-[5.4cqw] font-semibold uppercase tracking-[0.14em] opacity-90 ${
          layout === 'circle' || layout === 'initial' ? 'top-[8%]' : 'bottom-[8%]'
        } ${layout === 'stripes' ? 'left-[38%]' : ''}`}
      >
        {product.author}
      </p>

      {/* Lombada: sombra e brilho na borda esquerda dão volume de livro. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.22)_0,rgb(255_255_255/0.14)_2.5%,transparent_7%)]" />
    </div>
  )
}

function Art({ layout, title }: { layout: Layout; title: string }) {
  switch (layout) {
    case 'band':
      return <div className="absolute inset-x-0 top-[58%] h-[16%] bg-[var(--accent)] opacity-90" />
    case 'circle':
      return (
        <div className="absolute -right-[22%] top-[14%] aspect-square w-[88%] rounded-full bg-[var(--accent)] opacity-85" />
      )
    case 'stripes':
      return (
        <div className="absolute inset-y-0 left-0 flex w-[30%] gap-[2.4cqw] pl-[6cqw]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-full w-[1.6cqw] bg-[var(--accent)]" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      )
    case 'initial':
      return (
        <span
          aria-hidden
          className="absolute -right-[6%] top-[4%] font-display font-black leading-none text-[var(--accent)] opacity-80"
          style={{ fontSize: '92cqw' }}
        >
          {title.replace(/^(O|A|Os|As|Um|Uma)\s+/i, '').charAt(0)}
        </span>
      )
    case 'frame':
      return <div className="absolute inset-[5%] rounded-[2px] border-[1.2cqw] border-[var(--accent)] opacity-80" />
    case 'dots':
      return (
        <div
          className="absolute inset-x-0 top-[52%] h-[30%] opacity-70"
          style={{
            backgroundImage: 'radial-gradient(var(--accent) 1.4cqw, transparent 1.6cqw)',
            backgroundSize: '9cqw 9cqw',
          }}
        />
      )
  }
}
