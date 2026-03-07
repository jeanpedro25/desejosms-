# 🔧 INSTRUÇÕES DE CONFIGURAÇÃO - DesejoSMS

## 📋 ARQUIVOS CRIADOS

Foram criados os seguintes arquivos de integração:

- ✅ `.env.example` - Modelo de variáveis de ambiente
- ✅ `firebase-config.js` - Configuração do Firebase
- ✅ `firebase-database.js` - Funções de banco de dados
- ✅ `firebase-auth.js` - Sistema de autenticação
- ✅ `mercadopago-config.js` - Configuração do Mercado Pago
- ✅ `mercadopago-integration.js` - Integração de pagamentos
- ✅ `data-migration.js` - Migração de dados

---

## 🚀 PASSO 1: CRIAR CONTAS

### 1.1 GitHub (para código)

1. Acesse: https://github.com/signup
2. Crie uma conta gratuita
3. Confirme seu email

### 1.2 Vercel (para hospedagem)

1. Acesse: https://vercel.com/signup
2. Clique em "Continue with GitHub"
3. Autorize o Vercel

### 1.3 Firebase (para banco de dados)

1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Nome: `DesejoSMS`
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### 1.4 Mercado Pago (para pagamentos)

1. Acesse: https://www.mercadopago.com.br/developers
2. Crie uma conta (use CPF/CNPJ válido)
3. Acesse "Suas integrações"

---

## 🔥 PASSO 2: CONFIGURAR FIREBASE

### 2.1 Ativar Firestore Database

1. No Firebase Console, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de teste"**
4. Região: **`southamerica-east1` (São Paulo)**
5. Clique em **"Ativar"**

### 2.2 Ativar Authentication

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Começar"**
3. Habilite **"E-mail/Senha"**
4. Clique em **"Salvar"**

### 2.3 Ativar Storage

1. No menu lateral, clique em **"Storage"**
2. Clique em **"Começar"**
3. Aceite as regras padrão
4. Clique em **"Concluir"**

### 2.4 Obter Credenciais do Firebase

1. Clique no ícone de **engrenagem** ⚙️ → **"Configurações do projeto"**
2. Role até **"Seus aplicativos"**
3. Clique no ícone da **Web** `</>`
4. Apelido do app: `DesejoSMS Web`
5. Marque **"Configurar também o Firebase Hosting"** (opcional)
6. Clique em **"Registrar app"**

Você verá algo assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "desejosms.firebaseapp.com",
  projectId: "desejosms",
  storageBucket: "desejosms.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456",
  measurementId: "G-XXXXXXXXXX"
};
```

**⚠️ COPIE ESTAS INFORMAÇÕES!** Você usará no próximo passo.

---

## 💳 PASSO 3: CONFIGURAR MERCADO PAGO

### 3.1 Criar Aplicação

1. No painel do Mercado Pago, vá em **"Suas integrações"**
2. Clique em **"Criar aplicação"**
3. Nome: `DesejoSMS Pagamentos`
4. Tipo: **"Pagamentos online"**
5. Clique em **"Criar"**

### 3.2 Obter Credenciais de TESTE

1. Vá em **"Credenciais"** → **"Credenciais de teste"**
2. Copie:
   - **Public Key:** `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token:** `TEST-xxxxxxxxxxxx-xxxxxx-xxxx...`

**ℹ️ Use PRIMEIRO as credenciais de teste para testar tudo!**

### 3.3 Credenciais de PRODUÇÃO (depois)

1. Vá em **"Credenciais"** → **"Credenciais de produção"**
2. Copie:
   - **Public Key:** `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token:** `APP_USR-xxxxxxxxxxxx-xxxxxx-xxxx...`

---

## ⚙️ PASSO 4: CONFIGURAR ARQUIVO .env

### 4.1 Criar arquivo .env

No seu projeto, copie o arquivo `.env.example` para `.env`:

```powershell
cd c:\Users\geanp\Documents\augment-projects\desejosms
copy .env.example .env
```

### 4.2 Editar arquivo .env

Abra o arquivo `.env` e preencha com suas credenciais:

```env
# FIREBASE
FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=desejosms.firebaseapp.com
FIREBASE_PROJECT_ID=desejosms
FIREBASE_STORAGE_BUCKET=desejosms.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# MERCADO PAGO - TESTE (use primeiro)
MERCADOPAGO_PUBLIC_KEY_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-xxxxxxxxxxxx-xxxxxx-xxxx...

# MERCADO PAGO - PRODUÇÃO (use depois de testar)
MERCADOPAGO_PUBLIC_KEY_PROD=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN_PROD=APP_USR-xxxxxxxxxxxx-xxxxxx-xxxx...

# CONFIGURAÇÕES
NODE_ENV=development
SITE_URL=http://localhost:3025
```

**⚠️ IMPORTANTE:** Nunca compartilhe este arquivo `.env`!

---

## 📦 PASSO 5: INSTALAR DEPENDÊNCIAS

### 5.1 Instalar Firebase SDK

```powershell
npm install firebase
```

### 5.2 Atualizar .gitignore

Certifique-se de que o arquivo `.gitignore` contém:

```
.env
node_modules/
.vercel/
```

---

## 🧪 PASSO 6: TESTAR LOCALMENTE

### 6.1 Iniciar servidor local

```powershell
npm start
```

### 6.2 Abrir no navegador

http://localhost:3025

### 6.3 Testar cadastro

1. Clique em "Entrar / Cadastrar"
2. Crie uma conta com email real
3. Verifique se o usuário aparece no **Firebase Console** → **Firestore Database**

### 6.4 Abrir Console do navegador (F12)

Você deve ver:

```
✅ Firebase inicializado com sucesso!
✅ Mercado Pago configurado: test
```

Se ver erros, revise as credenciais no `.env`.

---

## 🚀 PASSO 7: FAZER DEPLOY

### 7.1 Configurar Git

```powershell
git init
git add .
git commit -m "Deploy inicial - DesejoSMS"
```

### 7.2 Criar repositório no GitHub

1. Vá em: https://github.com/new
2. Nome: `desejosms`
3. Privado ou Público (sua escolha)
4. Clique em **"Create repository"**

### 7.3 Enviar código para GitHub

```powershell
git remote add origin https://github.com/SEU-USUARIO/desejosms.git
git branch -M main
git push -u origin main
```

### 7.4 Deploy na Vercel

**OPÇÃO A - Via Interface:**

1. Acesse: https://vercel.com/new
2. Clique em "Import Git Repository"
3. Selecione `desejosms`
4. Clique em **"Import"**
5. Vá em **"Environment Variables"**
6. Adicione TODAS as variáveis do arquivo `.env`
7. Clique em **"Deploy"**

**OPÇÃO B - Via CLI:**

```powershell
npm install -g vercel
vercel login
vercel --prod
```

Durante o deploy, a Vercel perguntará pelas variáveis de ambiente.

---

## 🔐 PASSO 8: CONFIGURAR VARIÁVEIS NA VERCEL

No painel da Vercel:

1. Vá em **"Settings"** → **"Environment Variables"**
2. Adicione uma por uma:

| Nome | Valor |
|------|-------|
| `FIREBASE_API_KEY` | `AIzaSyB...` |
| `FIREBASE_AUTH_DOMAIN` | `desejosms.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `desejosms` |
| `FIREBASE_STORAGE_BUCKET` | `desejosms.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `FIREBASE_APP_ID` | `1:123...` |
| `MERCADOPAGO_PUBLIC_KEY_TEST` | `TEST-xxx...` |
| `MERCADOPAGO_ACCESS_TOKEN_TEST` | `TEST-xxx...` |
| `NODE_ENV` | `production` |

3. Clique em **"Save"**
4. Faça um novo deploy

---

## ✅ PASSO 9: TESTAR EM PRODUÇÃO

### 9.1 Acessar seu site

https://desejosms.vercel.app

### 9.2 Testar cadastro

Crie uma conta e veja se salva no Firebase.

### 9.3 Testar pagamento (sandbox)

1. Escolha um plano
2. Use cartão de teste: `5031 4332 1540 6351`
3. CVV: `123`
4. Validade: qualquer data futura
5. Verifique se o pagamento é aprovado

---

## 🎉 PRONTO!

Seu sistema está online com:

- ✅ Hospedagem na Vercel
- ✅ Banco de dados Firebase
- ✅ Autenticação funcionando
- ✅ Pagamentos configurados (teste)

---

## 📞 PRÓXIMOS PASSOS

1. **Migrar dados antigos:** Execute `data-migration.js`
2. **Ativar produção:** Troque credenciais de teste por produção
3. **Configurar domínio:** desejosms.com.br
4. **Testar tudo:** Faça testes completos
5. **Abrir para usuários!** 🚀

---

## ❓ DÚVIDAS COMUNS

**P: Onde pego as credenciais do Firebase?**  
R: Firebase Console → Configurações do Projeto → Seus Aplicativos → Web

**P: Como sei se o Firebase está funcionando?**  
R: Abra o console do navegador (F12), deve  aparecer "✅ Firebase inicializado"

**P: O que fazer se der erro no deploy?**  
R: Verifique os logs no painel da Vercel e confirme se todas as variáveis foram adicionadas

**P: Como testar pagamentos sem gastar dinheiro?**  
R: Use as credenciais de TESTE e cartões de teste do Mercado Pago

---

**Última atualização:** 2026-02-14  
**Status:** Pronto para configurar!
