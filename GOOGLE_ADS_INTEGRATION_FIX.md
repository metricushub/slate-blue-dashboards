# 🚀 SOLUÇÃO DEFINITIVA - Integração Google Ads

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Configuração OAuth Incompleta**
- As credenciais do Google OAuth (CLIENT_ID e CLIENT_SECRET) não estão configuradas no Supabase
- A URL de redirect não está configurada corretamente no Google Cloud Console

### 2. **Estrutura de Dados Inconsistente**
- Tabela `google_ads_connections` usa `customer_id` como TEXT
- Tabela `accounts_map` também usa `customer_id` mas sem foreign key
- Falta sincronização entre as tabelas

### 3. **Edge Functions com Problemas**
- As variáveis de ambiente não estão configuradas
- CORS não está permitindo chamadas do frontend

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Configurar Google Cloud Console

1. **Acesse o Google Cloud Console**
   - URL: https://console.cloud.google.com
   - Selecione ou crie um projeto

2. **Ative as APIs necessárias**
   ```
   - Google Ads API
   - Google OAuth2 API
   ```

3. **Configure as Credenciais OAuth 2.0**
   - Vá em "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "OAuth client ID"
   - Tipo de aplicação: "Web application"
   - Nome: "Lovable Google Ads Integration"
   
4. **Configure as URLs autorizadas**
   - **Authorized JavaScript origins:**
     ```
     https://zoahzxfjefjmkxylbfxf.supabase.co
     http://localhost:8080
     https://lovable.dev
     ```
   
   - **Authorized redirect URIs:**
     ```
     https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-oauth
     ```

5. **Copie as credenciais**
   - CLIENT_ID: (será algo como: 123456789-xxxx.apps.googleusercontent.com)
   - CLIENT_SECRET: (será algo como: GOCSPX-xxxxxxxxxx)

### PASSO 2: Configurar Supabase Dashboard

1. **Acesse seu projeto no Supabase**
   - URL: https://app.supabase.com/project/zoahzxfjefjmkxylbfxf

2. **Configure os Secrets das Edge Functions**
   - Vá em "Project Settings" > "Edge Functions"
   - Adicione os seguintes secrets:
   
   ```
   GOOGLE_OAUTH_CLIENT_ID = [seu_client_id_aqui]
   GOOGLE_OAUTH_CLIENT_SECRET = [seu_client_secret_aqui]
   GOOGLE_OAUTH_REDIRECT_URI = https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-oauth
   
   GOOGLE_ADS_CLIENT_ID = [mesmo_client_id]
   GOOGLE_ADS_CLIENT_SECRET = [mesmo_client_secret]
   GOOGLE_ADS_DEVELOPER_TOKEN = [seu_developer_token] (obter em https://ads.google.com/home/tools/manager-accounts/)
   ```

3. **Configure a URL de Redirect**
   - Em "Authentication" > "URL Configuration"
   - Adicione: `https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-oauth` como URL de redirect autorizada

### PASSO 3: Aplicar Correções no Código

Execute os comandos abaixo para aplicar as correções necessárias: