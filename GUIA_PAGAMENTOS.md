# 💳 GUIA DE CONFIGURAÇÃO DE PAGAMENTOS - DesejoSMS

## 📊 STATUS ATUAL

### ✅ O que já está implementado:
- ✅ Interface de configuração de pagamentos (`payment-config.html`)
- ✅ Sistema de planos (Básico R$ 149,90 | Top R$ 249,90 | SuperVIP R$ 399,90)
- ✅ Estrutura para múltiplos gateways
- ✅ Métodos de pagamento (Cartão, PIX, Boleto)
- ✅ Sistema de transações
- ✅ Sincronização com todo o sistema

### ⚠️ O que precisa ser configurado:
- ❌ Credenciais REAIS dos gateways de pagamento
- ❌ Webhooks para confirmação automática
- ❌ Banco de dados real (atualmente usa localStorage)
- ❌ Certificados SSL para produção

---

## 🚀 OPÇÕES DE GATEWAY DE PAGAMENTO

### 1️⃣ **MERCADO PAGO** (Recomendado para Brasil)

#### Por que escolher:
- ✅ Mais popular no Brasil
- ✅ Aceita PIX, Cartão, Boleto
- ✅ Documentação em português
- ✅ Taxas competitivas (2,99% + R$ 0,39 por transação)
- ✅ Aprovação rápida de conta

#### Como configurar:

**Passo 1: Criar conta**
1. Acesse: https://www.mercadopago.com.br/developers
2. Crie uma conta de desenvolvedor
3. Acesse o painel de desenvolvedores

**Passo 2: Obter credenciais**
1. Vá em "Suas integrações" → "Credenciais"
2. Copie:
   - **Public Key** (começa com `APP_USR-`)
   - **Access Token** (começa com `APP_USR-`)
3. Use primeiro as credenciais de **TESTE** (sandbox)
4. Depois mude para **PRODUÇÃO**

**Passo 3: Configurar no sistema**
1. Acesse: `http://localhost:3025/payment-config.html`
2. Clique em "Adicionar Gateway"
3. Preencha:
   - **Tipo:** Mercado Pago
   - **Nome:** Mercado Pago Produção
   - **Chave Pública:** Sua Public Key
   - **Chave Secreta:** Seu Access Token
   - **Webhook:** `https://seusite.com/webhook/mercadopago`
   - **Ambiente:** production
   - **Status:** active

---

### 2️⃣ **STRIPE** (Internacional)

#### Por que escolher:
- ✅ Melhor para público internacional
- ✅ Muito confiável e seguro
- ✅ Excelente documentação
- ✅ Suporte a múltiplas moedas
- ❌ Mais complexo para configurar no Brasil

#### Como configurar:

**Passo 1: Criar conta**
1. Acesse: https://stripe.com
2. Crie uma conta
3. Complete a verificação de identidade

**Passo 2: Obter credenciais**
1. Acesse o Dashboard
2. Vá em "Developers" → "API Keys"
3. Copie:
   - **Publishable Key** (pk_test_... ou pk_live_...)
   - **Secret Key** (sk_test_... ou sk_live_...)

---

### 3️⃣ **PIX Direto** (Sem intermediário)

#### Por que escolher:
- ✅ Sem taxas de gateway
- ✅ Recebimento instantâneo
- ❌ Requer confirmação manual
- ❌ Mais trabalhoso de implementar

#### Como configurar:

**Opção A - PIX Estático:**
1. Gere um QR Code PIX da sua conta
2. Usuário paga e envia comprovante
3. Você confirma manualmente

**Opção B - PIX Dinâmico (Recomendado):**
1. Use API do seu banco (Banco do Brasil, Itaú, etc.)
2. Gere PIX único para cada transação
3. Webhook confirma pagamento automaticamente

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Arquivos necessários para criar:

1. **mercadopago-integration.js** - Integração com Mercado Pago
2. **webhook-handler.js** - Processamento de webhooks
3. **database.js** - Conexão com banco de dados
4. **.env** - Variáveis de ambiente (credenciais)

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Preparação (1-2 dias)
- [ ] Escolher gateway de pagamento
- [ ] Criar conta no gateway
- [ ] Obter credenciais de TESTE
- [ ] Configurar credenciais no sistema
- [ ] Testar em ambiente sandbox

### Fase 2 - Integração (3-5 dias)
- [ ] Implementar integração com gateway
- [ ] Criar sistema de webhooks
- [ ] Configurar banco de dados real
- [ ] Implementar ativação automática de planos
- [ ] Testar fluxo completo de pagamento

### Fase 3 - Produção (1-2 dias)
- [ ] Obter credenciais de PRODUÇÃO
- [ ] Configurar SSL/HTTPS
- [ ] Configurar webhooks em produção
- [ ] Fazer testes reais com valores pequenos
- [ ] Ativar sistema para usuários

---

## 💰 CUSTOS ESTIMADOS

### Taxas dos Gateways:

**Mercado Pago:**
- Cartão de Crédito: 2,99% + R$ 0,39
- PIX: 0,99%
- Boleto: R$ 3,49

**Stripe:**
- Cartão de Crédito: 3,99% + R$ 0,39
- Internacional: 4,99% + R$ 0,39

**PIX Direto:**
- Sem taxas (apenas taxas bancárias se houver)

### Custos de Infraestrutura:

- **Hospedagem:** R$ 0 - R$ 50/mês (Vercel/Railway gratuito)
- **Banco de Dados:** R$ 0 - R$ 30/mês (Firebase/MongoDB gratuito até certo limite)
- **Domínio:** R$ 40/ano
- **SSL:** Gratuito (Let's Encrypt)

---

## 🔒 SEGURANÇA

### Obrigatório:
1. **HTTPS em produção** (obrigatório para pagamentos)
2. **Validação de webhooks** (verificar assinatura)
3. **Não expor chaves secretas** (usar variáveis de ambiente)
4. **Logs de transações** (auditoria)
5. **Backup de dados** (diário)

### Exemplo de .env:
```
MERCADOPAGO_PUBLIC_KEY=APP_USR_xxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR_xxxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxxx
DATABASE_URL=mongodb+srv://xxxxx
```

---

## 🆘 PROBLEMAS COMUNS

### Pagamento não confirma automaticamente:
- Verifique se o webhook está configurado
- Confirme que a URL do webhook está acessível
- Veja os logs do gateway

### Erro de CORS:
- Configure headers CORS no servidor
- Adicione domínio na whitelist do gateway

### Transação duplicada:
- Implemente idempotência
- Use IDs únicos para cada transação

---

## 📞 PRÓXIMOS PASSOS RECOMENDADOS

1. **Escolha o gateway** (Recomendo Mercado Pago para Brasil)
2. **Crie conta de desenvolvedor**
3. **Configure credenciais de teste**
4. **Teste o fluxo completo**
5. **Implemente banco de dados real**
6. **Configure webhooks**
7. **Faça deploy em produção**
8. **Teste com transações reais pequenas**
9. **Ative para usuários**

---

## 💡 DICA IMPORTANTE

**Comece com Mercado Pago em modo SANDBOX:**
- Não precisa de aprovação inicial
- Pode testar tudo sem dinheiro real
- Cartões de teste disponíveis
- Fácil migrar para produção depois

**Cartões de teste Mercado Pago:**
- Aprovado: 5031 4332 1540 6351
- Recusado: 5031 7557 3453 0604
- CVV: 123
- Validade: Qualquer data futura

---

## 📚 RECURSOS ÚTEIS

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Documentação Stripe](https://stripe.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 🎯 RESUMO EXECUTIVO

**Para colocar pagamentos no ar você precisa:**

1. **Escolher Gateway** → Mercado Pago (mais fácil para Brasil)
2. **Criar Conta** → https://www.mercadopago.com.br/developers
3. **Obter Credenciais** → Public Key + Access Token
4. **Configurar Sistema** → payment-config.html
5. **Implementar Webhooks** → Para confirmação automática
6. **Adicionar Banco de Dados** → Firebase ou MongoDB
7. **Testar** → Modo sandbox primeiro
8. **Produção** → Credenciais reais + HTTPS

**Tempo estimado:** 5-7 dias para implementação completa

**Custo inicial:** R$ 0 (pode começar com planos gratuitos)

---

**Quer que eu ajude a implementar alguma dessas integrações?** Posso:
1. Criar a integração com Mercado Pago
2. Configurar o sistema de webhooks
3. Implementar banco de dados Firebase
4. Criar fluxo completo de pagamento
