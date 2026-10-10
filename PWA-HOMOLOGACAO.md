# Homologação PWA — Neurotrânsito

## Estado
Implementação inicial isolada em `feat/neurotransito-pwa`. Não integrar à produção antes da homologação.

## Verificações necessárias
- [ ] Manifesto servido como JSON válido com MIME adequado.
- [ ] Ícones PNG 192x192 e 512x512 acessíveis por HTTPS.
- [ ] Instalação no Chrome Android e abertura em modo standalone.
- [ ] Service Worker instalado e atualização de versão validada.
- [ ] Login/logout Supabase e recuperação de senha.
- [ ] Feed, publicações, comentários, mídia e uploads.
- [ ] Sem cache de endpoints, dados pessoais, respostas de autenticação ou API.
- [ ] Sem erros de console e sem regressões em navegação móvel.
- [ ] Deploy de homologação confirmado antes de produção.

## Segurança
O Service Worker atual não intercepta requests cross-origin nem métodos diferentes de GET. Em navegação sem rede mostra apenas uma página de indisponibilidade; não tenta servir o feed antigo, evitando apresentar conteúdo dinâmico desatualizado.
