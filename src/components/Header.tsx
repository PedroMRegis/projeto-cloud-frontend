import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { ChatCircleText, MagnifyingGlass } from '@phosphor-icons/react'

import { useAuth } from '@/features/auth/AuthContext'
import { useChat } from '@/features/chat/ChatContext'
import { CATEGORY_LABELS } from '@/lib/format'

export function Header() {
  const { open, openChat } = useChat()
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')

  function search(event: FormEvent) {
    event.preventDefault()
    navigate(term.trim() ? `/catalogo?q=${encodeURIComponent(term.trim())}` : '/catalogo')
  }

  const accountLink = 'border-b-2 border-transparent pb-1 text-ink-500 transition-colors hover:text-ink-900'

  async function signOut() {
    await logout()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-30 border-b border-line bg-paper-50/92 backdrop-blur transition-[padding] duration-300 ${open ? 'lg:pr-[420px]' : ''}`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:gap-8 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2" aria-label="Cirro Livros — início">
          <span className="font-display text-[1.75rem] font-semibold leading-none tracking-tight">Cirro</span>
          <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-vermilion-500 sm:inline">
            livros
          </span>
        </Link>

        <form onSubmit={search} className="relative min-w-0 flex-1 md:max-w-md" role="search">
          <MagnifyingGlass size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Título, autor ou assunto"
            aria-label="Buscar no catálogo"
            className="w-full rounded-full border border-ink-900/12 bg-paper-100/70 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-ink-900 focus:bg-paper-50"
          />
        </form>

        <button type="button" onClick={openChat} className="btn-primary ml-auto shrink-0 !px-3 sm:!px-5">
          <ChatCircleText size={18} weight="fill" />
          <span className="hidden sm:inline">Falar com o livreiro</span>
        </button>
      </div>

      <nav aria-label="Categorias" className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
        <ul className="flex gap-6 whitespace-nowrap pb-2.5 text-sm">
          <li>
            <NavLink
              to="/catalogo"
              end
              className={({ isActive }) =>
                `border-b-2 pb-1 transition-colors ${isActive && !params.get('categoria') ? 'border-vermilion-500 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`
              }
            >
              Todo o catálogo
            </NavLink>
          </li>
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
            <li key={category}>
              <Link
                to={`/catalogo?categoria=${encodeURIComponent(category)}`}
                className={`border-b-2 pb-1 transition-colors ${
                  params.get('categoria') === category
                    ? 'border-vermilion-500 text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-900'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          {!loading && !user && (
            <li className="ml-auto">
              <Link to="/entrar" className={accountLink}>
                Entrar
              </Link>
            </li>
          )}
          {user && (
            <>
              <li className="ml-auto">
                <Link to="/minha-conta/conversas" className={accountLink}>
                  Conversas
                </Link>
              </li>
              <li>
                <Link to="/minha-conta/pedidos" className={accountLink}>
                  Pedidos
                </Link>
              </li>
              {user.role === 'admin' && (
                <li>
                  <Link to="/gestao" className={accountLink}>
                    Gestão
                  </Link>
                </li>
              )}
              <li>
                <button type="button" onClick={signOut} className={accountLink}>
                  Sair
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}
