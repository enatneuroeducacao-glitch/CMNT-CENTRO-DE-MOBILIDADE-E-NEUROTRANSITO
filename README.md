# CMNT — Rede de Mobilidade e Segurança Viária

Rede social especializada em trânsito, mobilidade e segurança viária.

## Arquitetura
- Frontend: aplicação web responsiva em HTML/CSS/JavaScript, pronta para Vercel.
- Dados: Supabase PostgreSQL — projeto HSI-DOTH-P-G, com tabelas sociais isoladas pelo prefixo `social_`.
- Autenticação: Supabase Auth.
- Núcleo social: perfis, publicações, reações, comentários, seguidores, salvos, comunidades, notificações, denúncias e mensagens.
- Integração futura: HSI-DOTH-P, NEXUS 12, ENAT e Central ENAT.

## Marca
O nome `FaceTransit` foi descartado para evitar conflito com uma empresa que já utilizou esse nome. O produto fica provisoriamente como **CMNT** até definição da marca definitiva. `NeuroTraffic` também não foi adotado porque já existe uma empresa internacional de pesquisa em segurança viária usando o nome.

## Publicação
O repositório está preparado para deploy estático na Vercel. Se o projeto Vercel existente estiver ligado a este repositório, o push para `main` dispara o novo deploy.
