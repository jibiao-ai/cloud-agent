# Cloud Agent - EasyStack 智能运维平台

<p align="center">
  <strong>基于自然语言对话的 EasyStack 云平台智能运维系统</strong>
</p>

## 项目概述

Cloud Agent 是一个 AI 驱动的云平台运维智能体系统，专为 EasyStack 云平台（ECF 6.2.1）设计。用户可以通过自然语言对话的方式完成云主机、云硬盘、网络、安全组、负载均衡、监控告警等运维操作。

### 核心特性

- **自然语言运维**: 通过对话方式管理 EasyStack 云资源，无需记忆复杂 API
- **多智能体支持**: 预置运维助手、故障诊断专家、资源优化顾问等多个专业 Agent
- **EasyStack ECF 6.2.1 API 集成**: 完整对接计算(Nova)、存储(Cinder)、网络(Neutron)、负载均衡(Octavia)、监控(ECMS)等服务
- **工作流编排**: 支持自动化运维工作流配置与执行
- **定时任务**: 支持 Cron 表达式配置的定时运维任务
- **实时通信**: WebSocket 支持实时对话
- **用户权限管理**: 完整的用户角色与权限体系

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (Frontend)                   │
│                   React + Vite + TailwindCSS          │
├─────────────────────────────────────────────────────┤
│                    Go Backend (Gin)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ REST API  │  │ WebSocket│  │  AI Agent Engine  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                  │             │
│  ┌────┴──────────────┴──────────────────┴─────────┐  │
│  │           Service Layer                         │  │
│  │  ┌─────────┐ ┌───────────┐ ┌────────────────┐  │  │
│  │  │Auth Svc │ │Chat Svc   │ │EasyStack Client│  │  │
│  │  └─────────┘ └───────────┘ └────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
├──────────┬──────────────────────┬────────────────────┤
│  MySQL   │      RabbitMQ        │  EasyStack Cloud    │
│  (数据库) │    (消息队列)         │  (ECF 6.2.1 API)   │
└──────────┴──────────────────────┴────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Vite | 现代化 SPA 框架 |
| UI | TailwindCSS | 实用优先的 CSS 框架 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 后端 | Go + Gin | 高性能 HTTP 框架 |
| ORM | GORM | Go ORM 框架 |
| 数据库 | MySQL 8.0 | 关系型数据库 |
| 消息队列 | RabbitMQ | AMQP 消息代理 |
| 容器化 | Docker Compose | 一键部署 |
| AI | OpenAI API (兼容) | 支持 GPT-4/DeepSeek/Qwen |

## 快速开始

### 前置条件

- Docker & Docker Compose
- EasyStack 云平台访问凭证
- OpenAI API Key (或兼容 API)

### 1. 克隆项目

```bash
git clone https://github.com/jibiao-ai/cloud-agent.git
cd cloud-agent
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入 EasyStack 和 AI API 配置
```

### 3. 一键启动

```bash
docker-compose up -d
```

### 4. 访问平台

- 前端界面: http://localhost
- 后端 API: http://localhost:8080
- RabbitMQ 管理: http://localhost:15672 (guest/guest)

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## EasyStack API 集成

基于 ECF 6.2.1 API 文档，已集成以下服务：

### 计算服务 (Nova)
- 云主机 CRUD、启停、重启、暂停/恢复
- 规格变更 (Resize)、快照创建
- 云硬盘挂载/卸载
- 规格查询、密钥对管理

### 块存储服务 (Cinder)
- 云硬盘 CRUD
- 云硬盘扩容
- 快照管理

### 网络服务 (Neutron SDN)
- 网络/子网管理
- 路由器管理、接口绑定
- 浮动IP 创建/绑定/解绑
- 安全组和安全组规则管理
- 端口管理

### 负载均衡 (Octavia)
- 负载均衡器管理
- 监听器管理
- 后端池管理

### 监控告警 (ECMS)
- PromQL 指标查询
- 告警信息查询
- 资源性能 TOP5

### 镜像服务 (Glance)
- 镜像列表查询

### 认证服务 (Keystone)
- Token 获取与管理
- 项目级别认证

## 项目结构

```
cloud-agent/
├── backend/                    # Go 后端
│   ├── cmd/server/main.go      # 入口文件
│   ├── internal/
│   │   ├── agent/              # AI Agent 引擎 (Tool Calling)
│   │   ├── config/             # 配置管理
│   │   ├── easystack/          # EasyStack API 客户端
│   │   ├── handler/            # HTTP 处理器
│   │   ├── middleware/         # 中间件 (Auth/CORS)
│   │   ├── model/              # 数据模型
│   │   ├── mq/                 # RabbitMQ 消息队列
│   │   ├── repository/         # 数据访问层
│   │   └── service/            # 业务逻辑层
│   ├── pkg/                    # 公共工具包
│   ├── Dockerfile
│   └── go.mod
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── components/         # 通用组件
│   │   ├── pages/              # 页面组件
│   │   ├── services/           # API 服务
│   │   ├── store/              # Zustand 状态管理
│   │   └── styles/             # 样式文件
│   ├── Dockerfile
│   └── package.json
├── docker/                     # Docker 配置
│   └── mysql/init.sql
├── docker-compose.yml          # 容器编排
├── .env.example                # 环境变量模板
└── README.md
```

## API 端点

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/login | 用户登录 |

### 智能体
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/agents | 获取智能体列表 |
| POST | /api/agents | 创建智能体 |
| PUT | /api/agents/:id | 更新智能体 |
| DELETE | /api/agents/:id | 删除智能体 |

### 对话
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/conversations | 获取会话列表 |
| POST | /api/conversations | 创建新会话 |
| DELETE | /api/conversations/:id | 删除会话 |
| GET | /api/conversations/:id/messages | 获取消息列表 |
| POST | /api/conversations/:id/messages | 发送消息 |
| GET | /api/ws | WebSocket 连接 |

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard | 仪表盘统计 |
| GET | /api/skills | 技能列表 |
| GET | /api/workflows | 工作流列表 |
| GET | /api/scheduled-tasks | 定时任务列表 |
| GET | /api/users | 用户列表(管理员) |

## 开发指南

### 本地开发

```bash
# 启动基础设施
docker-compose up -d mysql rabbitmq

# 后端开发
cd backend
go mod tidy
go run cmd/server/main.go

# 前端开发
cd frontend
npm install
npm run dev
```

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| EASYSTACK_AUTH_URL | Keystone 认证地址 | - |
| EASYSTACK_USERNAME | 用户名 | admin |
| EASYSTACK_PASSWORD | 密码 | - |
| EASYSTACK_DOMAIN | 域名 | default |
| EASYSTACK_PROJECT | 项目名 | admin |
| EASYSTACK_PROJECT_ID | 项目ID | - |
| AI_API_KEY | AI API 密钥 | - |
| AI_BASE_URL | AI API 地址 | https://api.openai.com/v1 |
| AI_MODEL | AI 模型名 | gpt-4 |

## 许可证

MIT License
