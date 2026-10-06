# CMNT — Rede de Mobilidade e Segurança Viária

Rede social especializada em trânsito, mobilidade e segurança viária, com núcleo científico integrado ao ecossistema ENAT/HSI.

## Arquitetura
- Frontend: aplicação web responsiva em HTML/CSS/JavaScript.
- Execução/publicação: arquitetura própria baseada em Docker + Nginx; **não depende de Vercel**.
- Dados: Supabase PostgreSQL — projeto HSI-DOTH-P-G, com tabelas sociais e científicas.
- Autenticação: Supabase Auth.
- Núcleo social: perfis, publicações, reações, comentários, seguidores, salvos, comunidades, notificações, denúncias e mensagens.
- Núcleo científico: CMNT Científico, pesquisa, evidências, pesquisador, NEXUS 12, HSI-DOTH-P, observatório, comunidades científicas e auditoria de atividade.
- Administração: Central ENAT HSI, com monitoramento das movimentações científicas e resultados HSI-DOTH-P.

## Publicação
O repositório é preparado para execução em servidor próprio por Docker Compose e Nginx. O branch `main` é a fonte oficial do código integrado.

## Marca
O nome `FaceTransit` foi descartado para evitar conflito com uma empresa que já utilizou esse nome. O produto fica como **CMNT** até definição da marca definitiva. `NeuroTraffic` também não foi adotado porque já existe uma empresa internacional de pesquisa em segurança viária usando o nome.
