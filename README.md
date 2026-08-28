# CMNT ENAT Hub

**Centro de Mobilidade e Neurotrânsito**  
**ENAT — Ensino Neuroeducacional Aplicado ao Trânsito**

Aplicação institucional do ecossistema ENAT para formação, inteligência humana, indicadores, pesquisa e gestão do ecossistema.

## Arquitetura

- **Frontend:** React + TypeScript + Vite
- **Backend/Dados:** Supabase dedicado ao Hub
- **Deploy:** Vercel
- **Repositório:** GitHub privado

## Módulos

- Visão Geral
- Academia ENAT
- HSI-DOTH-P
- Observatório CMNT
- Pesquisa
- Ecossistema
- Assinaturas
- Administração

## Regra de isolamento

Este projeto é independente do **Assistente do Instrutor**. Não compartilhará código, banco, segredos ou deploy com o sistema operacional do instrutor sem uma integração futura explicitamente planejada e autorizada.

## Segurança

Segredos e credenciais não devem ser versionados. Use `.env` localmente e as variáveis de ambiente protegidas do Vercel/Supabase para produção.

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```
