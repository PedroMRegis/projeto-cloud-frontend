# projeto-cloud-frontend

A loja da **Cirro Livros**, a livraria conversacional do projeto semestral de
Computação em Nuvem (Insper). Feita em React + TypeScript (Vite, Tailwind 4,
react-router, Phosphor).

| Repositório | Serviço ECS | Responsabilidade |
|---|---|---|
| [projeto-cloud-backend](https://github.com/PedroMRegis/projeto-cloud-backend) | `backend-api`, `order-worker` | Catálogo, cotação, pedido |
| [projeto-cloud-chatbot](https://github.com/PedroMRegis/projeto-cloud-chatbot) | `chatbot` | Vendedor conversacional |
| **projeto-cloud-frontend** (este) | `frontend` | Loja |
| [projeto-cloud-insper](https://github.com/joselsm3/projeto-cloud-insper) | — | Plano, infraestrutura, docs e compose da plataforma |

## Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Vitrine editorial: chamada, índice de estantes, prateleiras por categoria, livro em destaque, "como funciona" |
| `/catalogo?q=&categoria=&ordem=` | Busca (textual ou por significado, quando o backend tem embeddings), filtros, ordenação, "mostrar mais" |
| `/livro/:id` | Capa, sinopse, preço, estoque, quantidade e **"Cotar com o livreiro"**, além dos relacionados |
| `/pedido/:id` | Linha do tempo do pedido, atualizada sozinha enquanto o estoque é confirmado |

O **livreiro** (chat) é um painel lateral disponível em qualquer página. Ele
mostra:
- cards de livro;
- a cotação em formato de recibo;
- o pedido com status ao vivo;
- as **respostas rápidas** da etapa atual, que o cliente pode clicar em vez de digitar.

`?chat` abre o painel ao carregar e `?conversa=<id>` retoma uma conversa (útil
em demo).

## Design

Registro de livraria independente: papel quente, tinta quase preta e um único
acento vermelhão. Tipografia Fraunces nos títulos, Instrument Sans no corpo e IBM
Plex Mono nos números do recibo. As fontes são empacotadas, sem dependência de
CDN.

As **capas são tipográficas e geradas a partir do `product_id`**
(`src/components/BookCover.tsx`). Não há imagens de capa reais, o que evita
direitos autorais e dependência externa. Cada livro tem sempre a mesma capa, e o
texto escala com a largura via container queries.

## Integração e confiabilidade

- O frontend só usa **caminhos relativos**. Em produção, o ALB manda `/api/chat*` e `/api/conversations*` para o chatbot e o resto de `/api/*` para o backend. Em desenvolvimento, o proxy do Vite reproduz essas regras.
- Cada mensagem tem um `request_id`. "Tentar de novo" reenvia com o **mesmo** id, então o chatbot devolve a resposta guardada em vez de repetir a operação. Um 409 (mesmo id ainda em processamento) espera e repete.
- O `conversation_id` fica no `localStorage`, e a conversa é restaurada do servidor ao recarregar.
- Todas as telas têm estados de carregando, erro (com "tentar de novo") e vazio.

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173 (precisa do backend em :8001 e do chatbot em :8002)
npm run build        # checagem de tipos + build de produção
```

Para a plataforma inteira, use o compose do `projeto-cloud-insper`
(`make local-up` → <http://localhost:8000>).

## Imagem

`Dockerfile` multi-stage: build com Node e entrega com **nginx** não-root na
porta 8080. A imagem tem:
- `/health` para o target group do ALB;
- cache de 1 ano para `/assets/*`, cujos nomes têm hash;
- fallback de SPA para o `index.html`;
- logs de acesso em JSON para o CloudWatch.
