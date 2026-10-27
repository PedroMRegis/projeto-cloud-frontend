import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ChatCircleText } from '@phosphor-icons/react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useChat } from '@/features/chat/ChatContext'
import { ChatPanel } from '@/features/chat/ChatPanel'

export function RootLayout() {
  const { pathname } = useLocation()
  const { open, openChat } = useChat()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className={`flex-1 transition-[padding] duration-300 ${open ? 'lg:pr-[420px]' : ''}`}>
        <Outlet />
      </main>
      <div className={`transition-[padding] duration-300 ${open ? 'lg:pr-[420px]' : ''}`}>
        <Footer />
      </div>
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label="Abrir conversa com o livreiro"
          className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-vermilion-500 text-paper-50 shadow-book transition-transform hover:scale-105 sm:hidden"
        >
          <ChatCircleText size={26} weight="fill" />
        </button>
      )}
      <ChatPanel />
    </div>
  )
}
