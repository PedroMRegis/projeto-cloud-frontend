import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/instrument-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'

import { ChatProvider } from '@/features/chat/ChatContext'
import { Catalog } from '@/pages/Catalog'
import { Home } from '@/pages/Home'
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
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  </StrictMode>,
)
