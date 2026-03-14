# Shrimp 🦐

一个现代化的Web聊天机器人应用，支持实时对话、多会话管理、响应式设计。

## ✨ 功能特性

- **实时聊天**: 基于WebSocket的实时双向通信
- **多会话管理**: 支持创建和管理多个聊天会话
- **AI集成**: 集成OpenAI API提供智能回复
- **响应式设计**: 完美适配桌面和移动设备
- **主题切换**: 支持明暗主题切换
- **用户认证**: JWT-based身份验证系统
- **数据持久化**: MySQL数据库存储聊天记录

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **Socket.IO Client** - 实时通信客户端
- **React Markdown** - Markdown渲染

### 后端
- **NestJS** - Node.js企业级框架
- **TypeScript** - 类型安全的JavaScript
- **Socket.IO** - 实时双向通信
- **MySQL2** - MySQL数据库驱动
- **JWT** - JSON Web Token认证
- **Passport** - 认证中间件
- **OpenAI** - AI模型集成

## 📁 项目结构

```
shrimp/
├── packages/
│   ├── apps/
│   │   └── chat/                 # 前端应用
│   │       ├── src/
│   │       │   ├── components/   # React组件
│   │       │   │   ├── Sidebar.tsx
│   │       │   │   ├── ModelHeader.tsx
│   │       │   │   ├── ChatWindow.tsx
│   │       │   │   └── InputSend.tsx
│   │       │   ├── App.tsx       # 主应用组件
│   │       │   └── main.tsx      # 应用入口
│   │       ├── package.json
│   │       └── vite.config.ts
│   └── server/                   # 后端服务
│       ├── src/
│       │   ├── app.module.ts     # 主应用模块
│       │   ├── main.ts           # 应用入口
│       │   ├── chat/             # 聊天模块
│       │   │   ├── chat.gateway.ts
│       │   │   └── chat.service.ts
│       │   ├── auth/             # 认证模块
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   └── jwt.strategy.ts
│       │   └── db/               # 数据库配置
│       │       ├── mysql_config.ts
│       │       └── query.ts
│       ├── package.json
│       └── nest-cli.json
├── package.json                  # Monorepo配置
├── pnpm-workspace.yaml          # pnpm工作区配置
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- MySQL 8+

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd shrimp

# 安装所有依赖
pnpm install
```

### 数据库配置

1. 创建MySQL数据库
2. 修改 `packages/server/src/db/mysql_config.ts` 中的数据库连接配置

### 运行应用

```bash
# 启动后端服务
pnpm server

# 启动前端应用（新终端）
pnpm chat
```

应用将在以下地址运行：
- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 🔧 开发指南

### 可用脚本

```bash
# 前端开发
pnpm chat          # 启动前端开发服务器

# 后端开发
pnpm server        # 启动后端开发服务器
pnpm ws-server     # 启动WebSocket服务器

# 构建
pnpm --filter chat run build    # 构建前端
pnpm --filter server run build  # 构建后端

# 代码检查
pnpm --filter chat run lint     # 前端代码检查
pnpm --filter server run lint   # 后端代码检查
```

### 环境变量

创建 `.env` 文件配置以下变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=shrimp_chat

# JWT配置
JWT_SECRET=your_jwt_secret

# OpenAI配置
OPENAI_API_KEY=your_openai_api_key
```

## 📱 响应式特性

- **桌面端**: 侧边栏可折叠/展开，平滑动画过渡
- **移动端**: 抽屉式侧边栏，点击遮罩层关闭
- **主题适配**: 支持明暗主题切换

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [NestJS](https://nestjs.com/) - 强大的Node.js框架
- [React](https://reactjs.org/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Socket.IO](https://socket.io/) - 实时通信
- [OpenAI](https://openai.com/) - AI模型提供商