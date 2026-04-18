# Indústria 4.0 Pro 🏭

Sistema de gestão industrial focado em **Checklists Diários** e **Reporte de Ocorrências em Tempo Real**, com integração nativa com Google Drive e Autenticação Protegida.

## 📋 Funcionalidades Principais

- **Autenticação Segura (Supabase):** Sistema de login e cadastro real. Senhas criptografadas e gestão de usuários via Supabase Auth.
- **Hierarquia de Acesso:**
  - **Supervisor:** Acesso a um Dashboard consolidado com todas as ocorrências críticas enviadas pela equipe.
  - **Colaborador:** Interface otimizada para checklists rápidos no chão de fábrica.
- **Integração Google Drive:** Ocorrências com fotos são enviadas automaticamente para o Google Drive configurado, garantindo backup e auditoria.
- **Conexão Persistente:** O servidor mantém a autorização do Drive salva com segurança, eliminando a necessidade de reconectar toda vez que o app reinicia.
- **Design Premium:** Interface moderna, responsiva e de alta densidade visual construída com Tailwind CSS e fontes otimizadas (Inter).

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express (para proxy de mídias e persistência de OAuth).
- **Banco de Dados & Auth:** Supabase (Auth & PostgreSQL).
- **Armazenamento de Mídia:** Google Drive API v3.
- **Animações:** Framer Motion.

## 🛠️ Configuração Inicial

### 1. Requisitos
- Node.js instalado.
- Conta no Supabase.
- Credenciais de API do Google Cloud (OAuth 2.0) para integração com Drive.

### 2. Variáveis de Ambiente
Crie as seguintes variáveis no menu **Settings/Secrets** do AI Studio:
```env
# Google Drive OAuth Credentials
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="..."

# Supabase Configuration
VITE_SUPABASE_URL="..."
VITE_SUPABASE_ANON_KEY="..."
```
*(O `GOOGLE_REDIRECT_URI` deve ser a URL do seu app seguida de `/auth/callback`)*

### 3. Instalação
```bash
npm install
npm run dev
```

## 🔐 Segurança e Governança

- **Assinatura Digital:** Cada ocorrência é carimbada com o Nome do Operador, Turno e o E-mail de Autenticação Real (`Auth UID`), impedindo falsidade ideológica nos relatos industriais.
- **Privacidade:** As fotos não são armazenadas localmente no servidor; elas são transformadas em stream e enviadas diretamente para a nuvem do proprietário.

## 📂 Estrutura do Projeto

- `/src/components`: Componentes visuais (Login, Dashboards).
- `/src/supabase.ts`: Inicialização do SDK do Supabase.
- `/server.ts`: Servidor Express para gestão de Token Drive e Upload de arquivos.
- `/drive-token.json`: (Gerado automaticamente) Armazena de forma persistente o acesso ao Drive.

---
*Desenvolvido para máxima eficiência no ambiente de Indústria 4.0.*
