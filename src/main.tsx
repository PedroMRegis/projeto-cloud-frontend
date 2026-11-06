import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/instrument-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'

import { AuthProvider } from '@/features/auth/AuthContext'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ChatProvider } from '@/features/chat/ChatContext'
import { AuthPage } from '@/pages/AuthPage'
import { BackofficePage } from '@/pages/BackofficePage'
import { Catalog } from '@/pages/Catalog'
import { ConversationsPage } from '@/pages/ConversationsPage'
import { Home } from '@/pages/Home'
import { MyOrdersPage } from '@/pages/MyOrdersPage'
import { NotFound } from '@/pages/NotFound'
import { OrderPage } from '@/pages/OrderPage'
import { ProductPage } from '@/pages/ProductPage'
import { RootLayout } from '@/routes/RootLayout'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/catalogo', element: <Catalog /> },
      { path: '/livro/:id', element: <ProductPage /> },
      { path: '/pedido/:id', element: <OrderPage /> },
      { path: '/entrar', element: <AuthPage mode="login" /> },
      { path: '/cadastro', element: <AuthPage mode="register" /> },
      {
        path: '/minha-conta/conversas',
        element: (
          <RequireAuth>
            <ConversationsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/minha-conta/pedidos',
        element: (
          <RequireAuth>
            <MyOrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: '/gestao',
        element: (
          <RequireAuth admin>
            <BackofficePage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ChatProvider>
        <RouterProvider router={router} />
      </ChatProvider>
    </AuthProvider>
  </StrictMode>,
)
