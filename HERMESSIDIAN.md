# Hermessidian

> **Hermes Agent 嵌入 Obsidian 侧边栏**

Fork 自 [Claudian](https://github.com/YishenTu/claudian)，将 Claude SDK 替换为 Hermes Agent CLI 适配器。

## 核心原理

```
Hermessidian = Obsidian 插件框架 + Hermes CLI 适配器
                    ↓
    wsl hermes -z "message" → Windows Obsidian 侧边栏
```

## 架构

```
src/providers/hermes/
├── runtime/
│   ├── HermesChatRuntime.ts       # 核心运行时实现
│   └── HermesTaskResultInterpreter.ts
├── history/
│   └── HermesConversationHistoryService.ts
├── services/
│   └── HermesTitleGenerationService.ts
├── capabilities.ts                 # Provider 能力定义
└── registration.ts                 # Provider 注册
```

## Hermes 通信机制

Hermes Agent 运行在 WSL2 中，Hermessidian 插件通过以下方式调用：

```typescript
// 调用 Hermes via WSL
const result = execSync(`wsl hermes -z "${escapedPrompt}"`, {
    encoding: 'utf-8',
    windowsHide: true,
    timeout: 300000,
});
```

## Hermes Provider 能力

| 能力 | 支持 | 说明 |
|------|------|------|
| 持久运行时 | ❌ | 每次查询都是独立的 |
| 原生历史 | ❌ | 上下文通过 prompt 传递 |
| 计划模式 | ❌ | - |
| 回退(Rewind) | ❌ | - |
| 分叉(Fork) | ❌ | - |
| Provider 命令 | ❌ | - |
| 图片附件 | ❌ | - |
| MCP 工具 | ❌ | - |

Hermes 是一个更简单的提供者，主要用于基础聊天功能。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 类型检查
npm run typecheck

# 测试
npm run test
```

## 配置

Hermessidian 需要：
1. WSL2 环境
2. WSL2 中安装并配置 Hermes Agent
3. Windows 能够通过 `wsl hermes -z` 调用

### 测试 Hermes 调用

```bash
# 在 PowerShell 中测试
wsl hermes -z "你好，简单介绍一下自己"
```

## 与 Claudian 的区别

| 特性 | Claudian | Hermessidian |
|------|----------|---------------|
| AI Provider | Claude Code SDK | Hermes Agent |
| 运行环境 | 直接调用 | WSL2 |
| 持久会话 | ✅ | ❌ |
| MCP 工具 | ✅ | ❌ |
| 复杂功能 | ✅ | 基础聊天 |

## 许可证

MIT License (继承自 Claudian)
