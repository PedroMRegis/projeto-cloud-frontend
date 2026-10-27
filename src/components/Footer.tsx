import { Link } from 'react-router-dom'

import { CATEGORY_LABELS } from '@/lib/format'

export function Footer() {
  return (
    <footer className="mt-24 bg-ink-900 text-paper-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl font-semibold">Cirro</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper-300">
            Uma livraria em que você compra conversando. Projeto acadêmico de Computação em Nuvem
            (Insper): os pedidos são fictícios, mas cada um passa por banco, fila e confirmação de
            estoque de verdade.
          </p>
        </div>
        <div>
          <p className="eyebrow !text-paper-300">Estantes</p>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
              <li key={category}>
                <Link to={`/catalogo?categoria=${encodeURIComponent(category)}`} className="hover:text-vermilion-100">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow !text-paper-300">Como compramos</p>
          <ul className="mt-3 space-y-2 text-sm text-paper-300">
            <li>3 exemplares ou mais: até 5% de desconto</li>
            <li>5 ou mais (ou acima de R$ 300): até 10%</li>
            <li>Cotação válida por 30 minutos</li>
            <li>Estoque confirmado em segundos</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper-50/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-paper-300 sm:px-6">
          Capas geradas tipograficamente. Títulos e autores reais; preços e estoque fictícios.
        </p>
      </div>
    </footer>
  )
}
