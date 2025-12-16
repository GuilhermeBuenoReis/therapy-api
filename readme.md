# Therapy API

## 1. Project Overview
Backend SaaS especializado em apoiar profissionais da saúde (psicólogos, fisioterapeutas, nutricionistas etc.) na gestão de usuários, perfis profissionais, pacientes, sessões, prontuários, pagamentos lógicos e assinaturas mensais. Apenas as camadas de domínio e aplicação existem neste momento; toda a lógica está encapsulada em entidades puras, contratos de repositório e casos de uso alinhados a regras de negócio.

## 2. Domain Vision
Oferecer uma plataforma unificada em que o profissional autenticado organiza sua agenda, transfere pacientes preservando histórico, evita conflitos de sessões, registra evoluções clínicas, acompanha recebimentos lógicos e depende de uma assinatura ativa para operar. A visão segue DDD: linguagem ubíqua clara, agregados com invariantes explícitos e serviços de aplicação que orquestram políticas do negócio sem dependências de infraestrutura.

## 3. Core Concepts
- **Domínio isolado**: somente entidades e serviços de aplicação, sem detalhes técnicos externos.
- **Entidades com invariantes fortes**: vínculos obrigatórios, registros imutáveis (pagamentos, prontuários) e políticas temporais (sessões, assinaturas).
- **Repositórios como contratos**: apenas interfaces descrevendo operações necessárias (buscar, validar conflitos, registrar eventos).
- **Casos de uso orientados ao negócio**: serviços processam transferências de pacientes, agendamentos, geração de prontuários, relatórios de receita e gestão de assinaturas.
- **Modelo SaaS mensal**: a assinatura controla permissões, incluindo período de read-only quando expira.

## 4. Entities Description
### Usuário
- Identidade principal do sistema, pode ou não atuar como profissional (prepara suporte a múltiplos perfis futuros).
- Mantém vínculo com assinatura atual para liberar acesso.

### Profissional
- Sempre associado a um `Usuário`.
- Armazena dados obrigatórios de identificação e contato.
- Apenas edita seu próprio perfil; possui lista de pacientes e sessões.

### Paciente
- Vinculado obrigatoriamente a um único `Profissional`.
- Permite transferência para outro profissional mantendo 100% do histórico (sessões, prontuários, pagamentos).
- Referencia registros clínicos, sessões e pagamentos pertinentes.

### Sessão
- Agendamento contendo paciente, profissional, data, hora, duração, preço e notas.
- Garante ausência de conflitos de agenda para ambos os participantes.
- Status segue fluxo cronológico (agendada → concluída/cancelada); sessões canceladas não podem virar concluídas.
- Após a conclusão, gera automaticamente um prontuário.
- Sessões concluídas preservam dados cronológicos e status; apenas preço, notas e duração podem ser atualizados.

### Prontuário
- Registro clínico criado por sessão concluída.
- Contém informações essenciais definidas pelo profissional.
- Nunca pode ser excluído e só é acessível pelo profissional responsável pelo paciente.

### Pagamento
- Registro lógico do valor acordado por sessão e de pagamentos efetuados, incluindo data.
- Associado a paciente e profissional, imutável após criação (sem edição ou exclusão).
- Serve de base para relatórios de receita mensal.

### Assinatura
- Modelo mensal com status (ativa, expirada, em modo leitura, bloqueada).
- Controla acesso global: ao expirar entra em read-only por 7 dias; após esse prazo impede qualquer ação.
- Serviços de criação, verificação e renovação mantêm histórico de vigências e podem registrar um PaymentLog opcional ligado à assinatura.

## 5. Repository Contracts
- **UserRepository**: localizar usuários, verificar papéis (profissional ou não) e relacionar assinatura vigente.
- **ProfessionalRepository**: criar/atualizar perfil, garantir exclusividade dos dados e recuperar pacientes/sessões próprias.
- **PatientRepository**: cadastrar pacientes somente quando o profissional existe, realizar transferências mantendo histórico e restringir consultas ao dono.
- **SessionRepository**: validar conflito por profissional e paciente, persistir sessões, aplicar transições de status cronológicas e travar campos imutáveis após conclusão.
- **MedicalRecordRepository**: criar prontuários derivados das sessões e fornecer acesso somente ao profissional vinculado.
- **PaymentRepository**: registrar valores de sessões e pagamentos, impedir alterações, fornecer base para relatórios mensais.
- **SubscriptionRepository**: armazenar assinatura mensal, registrar pagamentos lógicos (PaymentLog opcional), controlar modo read-only e bloquear acesso após 7 dias de expiração.

## 6. Use Cases Overview
- **Cadastro e manutenção de profissionais**: valida dados mínimos, associa usuário e bloqueia edições cruzadas.
- **Gestão de pacientes**: criação condicionada à existência do profissional, transferência com histórico preservado e consultas restritas.
- **Agendamento e controle de sessões**: criação somente com vínculos válidos, prevenção de conflitos, fluxo de status e edição limitada pós-conclusão.
- **Registro clínico**: geração de prontuários completos e imutáveis quando sessões são concluídas, com acesso restrito.
- **Financeiro lógico**: salvar valor da sessão na criação, registrar pagamentos e emitir relatório mensal por profissional.
- **Assinaturas**:
  - `CreateSubscriptionService`: cria assinatura mensal com vigência inicial e PaymentLog opcional.
  - `CheckSubscriptionStatusService`: verifica se a assinatura está ativa ou em read-only antes de liberar ações essenciais.
  - `RenewSubscriptionService`: renova manualmente, estendendo a validade e saindo de read-only quando aplicável.
  - Políticas adicionais: impedir ações essenciais com assinatura expirada e encerrar totalmente o acesso após 7 dias.

## 7. Business Rules (RN list)
- **RN01**: Criar paciente apenas se o profissional existir.
- **RN02**: Paciente só pode ser atendido pelo profissional ao qual está vinculado.
- **RN03**: Profissional não visualiza pacientes que não lhe pertencem.
- **RN04**: É possível transferir paciente mantendo todo o histórico.
- **RN05**: Criar sessão apenas se o paciente pertence ao profissional.
- **RN06**: Não permitir sessões com conflito de horário para profissional ou paciente.
- **RN07**: Alterar status de sessão somente seguindo regras cronológicas.
- **RN08**: Sessão cancelada não pode ser marcada como concluída.
- **RN09**: Sessão concluída não pode ter data/hora/status alterados; apenas preço, notas e duração são editáveis.
- **RN10**: Sessão concluída gera registro de prontuário.
- **RN11**: Prontuário deve conter informações clínicas essenciais.
- **RN12**: Prontuário não pode ser excluído.
- **RN13**: Profissional não acessa prontuários de pacientes que não lhe pertencem.
- **RN15**: Registrar o valor da sessão no momento da criação.
- **RN16**: Registrar valor e data de cada pagamento.
- **RN17**: Pagamentos não podem ser editados nem deletados.
- **RN18**: Gerar relatório mensal de receita por profissional.
- **RN19**: Exigir dados mínimos obrigatórios no cadastro de profissionais.
- **RN20**: Profissional não pode editar dados de outro profissional.
- **RN21**: Usuário pode ou não ser profissional (preparação para múltiplos papéis).
- **RN22**: Dashboard só pode ser acessado mediante autenticação.
- **RN23**: Paciente não acessa nenhum recurso do sistema.
- **RN24**: SaaS opera via assinatura mensal.
  - **RN24.1**: Possível criar assinatura (`CreateSubscriptionService`).
  - **RN24.2**: Possível verificar se assinatura está ativa (`CheckSubscriptionStatusService`).
  - **RN24.3**: Possível renovar assinatura manualmente (`RenewSubscriptionService`).
  - **RN24.4**: Ações essenciais são bloqueadas quando a assinatura expira.
  - **RN24.5**: Permite registrar um pagamento da assinatura (PaymentLog opcional no MVP).
- **RN25**: Assinatura expirada entra em modo leitura por 7 dias.
- **RN26**: Após 7 dias de expiração, nenhum acesso ou ação é permitido.

## 8. Subscription Model Explanation
O sistema utiliza assinatura mensal para liberar funcionalidades. Ao criar uma assinatura, define-se a vigência inicial e, opcionalmente, um PaymentLog registra o pagamento correspondente. Enquanto a assinatura está ativa, todos os casos de uso funcionam normalmente. Ao expirar, o `CheckSubscriptionStatusService` ativa um período de 7 dias em modo read-only: consultas são permitidas, mas ações essenciais ficam bloqueadas (RN24.4 e RN25). Passado esse intervalo, o acesso é totalmente revogado (RN26) até que `RenewSubscriptionService` aplique uma nova vigência. O modelo não processa transações reais, apenas verifica estados lógicos.

## 9. What Is NOT Implemented Yet
- Camada de infraestrutura, persistência real ou integrações externas.
- Controladores, APIs, protocolos de transporte ou interfaces de usuário.
- Processamento financeiro real, gateways ou automações externas.
- Mecanismos de notificação, filas, eventos externos ou scripts de implantação.

## 10. Next Steps
- Implementar camada de infraestrutura seguindo os contratos definidos, mantendo isolamento do domínio.
- Adicionar adaptadores de entrada/saída (HTTP, mensageria, CLI) sem expor detalhes técnicos no domínio.
- Criar testes abrangentes para cada regra de negócio, inclusive fluxo de assinatura e relatórios.
- Modelar eventos de domínio para suportar notificações (ex.: assinatura prestes a expirar) quando a infraestrutura existir.
- Documentar políticas de segurança, auditoria, retenção e privacidade na futura camada técnica.

## 11. Ambiente local & seed
1. Copie o arquivo `.env.example` para `.env` e ajuste os valores se necessário.
2. Execute as migrações: `pnpm drizzle-kit migrate`.
3. Popule o banco com dados de teste e pagamento confirmado: `pnpm seed`.

### Credenciais padrão do seed
- **Profissional:** `ana.albuquerque@therapy.test` / `Therapy#2024`
- **Paciente:** `carlos.maia@therapy.test` / `Therapy#2024`
