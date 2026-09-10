# AVA ENAT-HSI — Arquitetura de Aula ao Vivo

## Objetivo
Oferecer uma experiência de videoconferência integrada ao percurso pedagógico, com agenda, acesso autenticado, presença, interação e gravação.

## Arquitetura recomendada
`AVA > Aula > Sessão ao vivo > Sala > Presença > Gravação > Replay`

## Camada de sala
A aplicação deve usar uma interface de abstração de provedor. O provedor pode ser:
- videoconferência externa;
- streaming ao vivo;
- infraestrutura WebRTC própria.

## Requisitos da sala
- URL/room segura;
- controle de acesso;
- identificação do participante;
- microfone/câmera sob permissão do usuário;
- chat;
- compartilhamento de tela quando suportado;
- gravação quando habilitada;
- indicação de transmissão ativa;
- encerramento da sessão;
- página de replay.

## Fluxo do professor
1. Criar sessão.
2. Definir data e horário.
3. Vincular curso/módulo/aula.
4. Definir duração e política de acesso.
5. Publicar aviso.
6. Abrir sala.
7. Iniciar transmissão.
8. Registrar presença.
9. Encerrar sessão.
10. Associar gravação.

## Fluxo do aluno
1. Receber aviso.
2. Entrar no curso.
3. Ver sessão agendada.
4. Entrar na sala no período permitido.
5. Participar.
6. Ter presença registrada.
7. Assistir à gravação posteriormente, se liberada.

## Segurança e privacidade
- Nunca expor links administrativos.
- Evitar salas públicas sem autenticação.
- Aplicar política de gravação e consentimento conforme a finalidade.
- Controlar quem pode visualizar replay.
- Registrar eventos essenciais sem coletar dados excessivos.

## Plano técnico de evolução
### MVP
Integração por room_url com provedor externo + presença no AVA + gravação vinculada.

### V2
Sala embutida com SDK de videoconferência.

### V3
WebRTC/LiveKit ou solução equivalente, com controle completo de sala, chat, presença e gravação.

## Continuidade operacional
Preparar procedimento para queda de conexão, troca de sala, gravação indisponível, professor ausente e encerramento emergencial. Toda sessão deve ter um canal alternativo de comunicação previamente definido.
