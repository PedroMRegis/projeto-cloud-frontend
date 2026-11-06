import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { LockKey } from '@phosphor-icons/react'

import { useAuth } from './AuthContext'

/**
 * Esconde a tela de quem não deve vê-la. É só conveniência: quem protege os
 * dados são as rotas da API, que checam a sessão e o papel em cada requisição.
 */
export function RequireAuth({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return <p className="px-6 py-20 text-center text-sm text-ink-400">Carregando…</p>
  if (!user) return <Navigate to={`/entrar?proximo=${encodeURIComponent(pathname)}`} replace />
  if (admin && user.role !== 'admin') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-20 text-center">
        <LockKey size={32} className="text-ink-400" />
        <h1 className="font-display text-2xl font-semibold">Acesso restrito</h1>
        <p className="text-sm text-ink-500">Esta área é só para a gestão da loja.</p>
        <Link to="/" className="btn-ghost mt-2">
          Voltar para a loja
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
