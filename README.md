# AIOPS 智能运维平台

> 基于 AI 大模型的智能云平台运维系统，支持多云接入、自然语言运维操作、自动化工作流。

## 功能特性

- 🤖 **多模型 AI 对话** — 支持 13 家主流 AI 厂商，可随时切换，一键测试连通性
- ☁️ **多云平台接入** — 支持 EasyStack（Keystone 认证）和 ZStack（AccessKey 认证）
- 🛡️ **多用户权限管理** — admin / user 双角色，bcrypt 密码加密，密码强度校验
- ⚡ **定时任务与工作流** — 支持 Cron 表达式调度、工作流编排
- 🎨 **三套主题切换** — 白色 / 黑色 / 蓝色主题，实时切换

## 支持的 AI 模型

| 厂商 | 标识 | 推荐模型 | 说明 |
|------|------|----------|------|
| OpenAI | 🤖 | gpt-4o | GPT-4o / GPT-4 / GPT-3.5 系列 |
| DeepSeek | 🔍 | deepseek-chat | 深度求索，高性价比国产大模型 |
| 通义千问 | ☁️ | qwen-plus | 阿里云 Qwen-Plus / Qwen-Max 系列 |
| 智谱 GLM | 🧠 | glm-4 | 智谱 AI GLM-4 / GLM-4-Flash 系列 |
| MiniMax | ⚡ | abab6.5s-chat | MiniMax abab 系列 |
| 硅基流动 | 💎 | Qwen/Qwen2.5-7B-Instruct | 支持 Qwen / DeepSeek / GLM 开源模型推理，性价比极高 |
| Moonshot (Kimi) | 🌙 | moonshot-v1-8k | 超长上下文，8k / 32k / 128k |
| 百度文心一言 | 🔵 | ernie-4.5-8k | ERNIE 4.5 / 4.0 / Speed 系列 |
| 火山引擎（豆包） | 🔥 | doubao-pro-4k | 字节豆包 doubao-pro / lite 系列 |
| 腾讯混元 | 🌀 | hunyuan-pro | 混元 pro / standard 系列 |
| 百川智能 | 🐋 | Baichuan4 | Baichuan4 / Baichuan3-Turbo 系列 |
| Anthropic Claude | 🎭 | claude-3-5-sonnet-20241022 | claude-3-5-sonnet / haiku / opus |
| Google Gemini | ✨ | gemini-2.0-flash | gemini-2.0-flash / 1.5-pro 系列 |

## 支持的云平台

| 类型 | 认证方式 | 说明 |
|------|----------|------|
| EasyStack | Keystone Token | 填写 AuthURL / 用户名 / 密码 / 域名 / 项目名称 |
| ZStack | AccessKey | 填写 Endpoint / AccessKeyID / AccessKeySecret |

## 快速部署

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone <repo-url>
cd cloud-agent

# 启动所有服务（MySQL + RabbitMQ + Backend + Frontend）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看后端日志
docker compose logs -f backend
```

访问地址：http://localhost （或服务器 IP）

### 本地开发模式

```bash
# 启动基础服务
docker compose up -d mysql rabbitmq

# 后端（需要 Go 1.21+）
cd backend
go mod download
go run cmd/server/main.go

# 前端（需要 Node.js 18+）
cd frontend
npm install
npm run dev
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DB_DRIVER` | `mysql` | 数据库驱动，可选 `mysql` / `sqlite` |
| `DB_HOST` | `mysql` | MySQL 主机名 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_NAME` | `cloud_agent` | 数据库名 |
| `DB_USER` | `root` | 数据库用户名 |
| `DB_PASSWORD` | `password` | 数据库密码 |
| `DB_PATH` | `cloud_agent.db` | SQLite 文件路径（仅 sqlite 模式） |
| `JWT_SECRET` | `change-me-in-production` | JWT 签名密钥，**生产环境必须修改** |
| `SERVER_PORT` | `8080` | 后端监听端口 |
| `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672/` | RabbitMQ 连接地址（可选） |
| `EASYSTACK_AUTH_URL` | — | EasyStack Keystone 地址 |
| `EASYSTACK_USERNAME` | — | EasyStack 用户名 |
| `EASYSTACK_PASSWORD` | — | EasyStack 密码 |
| `EASYSTACK_DOMAIN` | `Default` | EasyStack 域名 |
| `EASYSTACK_PROJECT` | — | EasyStack 项目名 |

## 默认账号

| 字段 | 值 |
|------|----|
| 用户名 | `admin` |
| 密码 | `Admin@2024!` |

> ⚠️ **首次登录后请立即修改密码！**

## 密码安全要求

系统强制密码策略（创建/修改用户时生效）：

- ✅ 长度至少 **9 位**
- ✅ 包含至少一个**大写字母**（A-Z）
- ✅ 包含至少一个**小写字母**（a-z）
- ✅ 包含至少一个**数字**（0-9）
- ✅ 包含至少一个**特殊字符**（`!@#$%^&*` 等）

示例合法密码：`Admin@2024!`、`MyP@ssw0rd!`

## 架构

```
┌─────────────────────────────────────────────────┐
│                    用户浏览器                      │
│              React + Vite + Tailwind CSS          │
└───────────────────────┬─────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────┐
│                   Nginx 反向代理                   │
│         /api/* → Backend   /* → Frontend          │
└──────────┬────────────────────────────┬──────────┘
           │                            │
┌──────────▼──────────┐   ┌────────────▼──────────┐
│    Go + Gin 后端     │   │   静态前端文件          │
│  JWT 认证 / REST API │   │   React 构建产物        │
└──────────┬──────────┘   └───────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐   ┌────▼────┐
│ MySQL │   │RabbitMQ │
│  数据库│   │  消息队列│
└───────┘   └─────────┘
```

**技术栈：**
- **后端**：Go 1.21 + Gin + GORM + JWT
- **前端**：React 18 + Vite + Tailwind CSS + Lucide Icons
- **数据库**：MySQL 8.0（开发可用 SQLite）
- **消息队列**：RabbitMQ 3（可选，不影响核心功能）
- **容器化**：Docker + Docker Compose + Nginx

## API 接口概览

所有 API 以 `/api` 为前缀，受保护接口需携带 `Authorization: Bearer <token>` 请求头。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 用户登录，返回 JWT Token |
| GET | `/api/profile` | 获取当前用户信息 |
| GET | `/api/dashboard` | 获取仪表盘统计数据 |
| GET/POST/PUT/DELETE | `/api/agents` | 智能体 CRUD |
| GET/POST/DELETE | `/api/conversations` | 会话 CRUD |
| GET/POST | `/api/conversations/:id/messages` | 消息列表和发送 |
| GET | `/api/ws` | WebSocket 实时对话 |
| GET | `/api/skills` | 技能中心列表 |
| GET/POST | `/api/workflows` | 工作流 CRUD |
| GET/POST | `/api/scheduled-tasks` | 定时任务 CRUD |
| GET/PUT/POST | `/api/ai-providers` | AI 模型提供商配置和测试 |
| GET/POST/PUT/DELETE/POST | `/api/cloud-platforms` | 云平台接入 CRUD 和连接测试 |
| GET/POST/PUT/DELETE | `/api/users` | 用户管理（Admin 权限） |

## License

MIT
