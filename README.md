# Channel Manager MVP - Pousada Sancho

Sistema completo de channel manager para pousadas com integração de múltiplas OTAs (Booking.com, Expedia, Hotels.com), controle de check-in/check-out, gestão financeira e equipe.

## 🚀 Funcionalidades

- **Calendário Interativo**: Visualização de 14 dias com reservas de múltiplas OTAs
- **Gestão de Check-in/Out**: Painel em tempo real de chegadas e partidas
- **Controle Financeiro**: KPIs, despesas categorizadas e margem líquida
- **Gestão de Equipe**: Controle de usuários, permissões e papéis
- **Autenticação Segura**: Sistema baseado em cookies HttpOnly com permissões granulares
- **Integração com Channex**: Pronto para conectar com provedor de channel management

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Sequelize ORM
- **Banco**: MySQL
- **Autenticação**: Cookies HttpOnly + bcryptjs
- **UI/UX**: Framer Motion, Lucide Icons, Glassmorphism design

## 📋 Pré-requisitos

- Node.js 18+
- MySQL 8.0+ (ou MariaDB)
- npm ou yarn

## ⚙️ Instalação e Configuração

### 1. Clone e instale dependências

```bash
git clone <repository-url>
cd Template-SaaS-Pousada
npm install
```

### 2. Configure o banco de dados MySQL

Crie um banco de dados MySQL:

```sql
CREATE DATABASE channel_manager;
```

### 3. Configure variáveis de ambiente

Copie e edite o arquivo `.env.local`:

```bash
cp .env.local.example .env.local
```

Edite as variáveis no `.env.local`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=channel_manager
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql

# Next.js Configuration
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXTAUTH_URL=http://localhost:3002

# Application Settings
APP_NAME=Nome da Sua Pousada
APP_URL=http://localhost:3002
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse: http://localhost:3002

## 👥 Usuários de Demonstração

O sistema cria automaticamente usuários de demonstração:

| Email                             | Senha         | Papel | Permissões        |
| --------------------------------- | ------------- | ----- | ----------------- |
| admin@pousadasancho.com           | sancho123     | Owner | Todas             |
| camila.recepcao@pousadasancho.com | equipe123     | Staff | calendar, checkin |
| joao.manutencao@pousadasancho.com | manutencao123 | Staff | calendar          |

## 📁 Estrutura do Projeto

```
app/
  api/auth/           # Rotas de autenticação
  api/team/           # Gestão de equipe
  api/checkin/        # Check-in/check-out
  dashboard/          # Páginas do painel
components/           # Componentes React
lib/                 # Utilitários e configurações
models/              # Modelos Sequelize
services/            # Serviços externos (Channex)
types/               # Definições TypeScript
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Verificação de código

## 🗄️ Banco de Dados

O sistema usa Sequelize ORM com MySQL. As tabelas são criadas automaticamente na primeira execução.

### Tabelas Principais

- **users**: Membros da equipe
- **rooms**: Quartos da pousada
- **reservations**: Reservas de hóspedes

## 🔐 Sistema de Permissões

- **Owner**: Acesso completo a todas as funcionalidades
- **Staff**: Acesso limitado baseado em permissões específicas
- **Permissões**: calendar, finance, checkin, team

## 🌐 Integração com Channex

O sistema está preparado para integração com Channex.io através do serviço `services/channexService.ts`. Atualmente usa dados mockados para demonstração.

## 📝 Observações

- A UI lê dados exclusivamente de `services/channexService.ts`
- Os modelos Sequelize estão prontos para integração real
- Autenticação atual é baseada em cookies para MVP
- Sistema preparado para escalabilidade e produção
