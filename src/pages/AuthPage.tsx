import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { useAuth } from '@/features/auth/AuthContext'

const INPUT =
  'w-full rounded-lg border border-ink-900/15 bg-paper-50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink-900'

// Só caminhos internos: `//site.com` levaria o cliente para fora da loja.
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('proximo'))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'

  if (user) return <Navigate to={next} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isRegister) await register(name, email, password)
      else await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError('Confira os dados: use um e-mail válido e uma senha de pelo menos 8 caracteres.')
      } else if (err instanceof ApiError && err.status !== 0) {
        setError(err.message.charAt(0).toUpperCase() + err.message.slice(1) + '.')
      } else {
        setError('Não foi possível conectar. Tente de novo.')
      }
    } finally {
      setBusy(false)
    }
  }

  const otherMode = `${isRegister ? '/entrar' : '/cadastro'}${next === '/' ? '' : `?proximo=${encodeURIComponent(next)}`}`

  return (
    <section className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">
      <p className="eyebrow">Sua conta</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">{isRegister ? 'Criar conta' : 'Entrar'}</h1>
      <p className="mt-2 text-sm text-ink-500">
        Com uma conta, suas conversas e seus pedidos ficam guardados em qualquer aparelho.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        {isRegister && (
          <label className="block text-sm font-medium">
            Nome
            <input
              className={`${INPUT} mt-1.5`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          E-mail
          <input
            className={`${INPUT} mt-1.5`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Senha
          <input
            className={`${INPUT} mt-1.5`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : 1}
            maxLength={128}
            required
          />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-vermilion-50 px-3 py-2 text-sm text-vermilion-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Aguarde…' : isRegister ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-500">
        {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
        <Link to={otherMode} className="font-semibold text-vermilion-600 hover:underline">
          {isRegister ? 'Entrar' : 'Criar conta'}
        </Link>
      </p>
    </section>
  )
}
