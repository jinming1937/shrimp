# AI Doll - React Native App

一个可爱的AI卡通人物语音对话应用。

## 功能特性

- 🤖 **AI对话** - 与可爱的卡通人物进行对话
- 🎨 **自定义外观** - 设置人物的发色、肤色、眼睛颜色和服装
- 🎭 **多种性格** - 可爱、性感、调皮、优雅四种性格可选
- 💃 **动作互动** - 让卡通人物跳舞、挥手等
- 🔊 **语音播报** - AI回复会自动语音播报
- 🌐 **多语言** - 支持中文、英文切换

## 技术栈

- React Native + Expo
- TypeScript
- Zustand (状态管理)
- React Navigation
- React Native SVG (卡通人物绘制)
- Expo Speech (语音合成)

## 项目结构

```
src/
├── components/          # 组件
│   ├── DollCharacter.tsx    # 卡通人物组件
│   ├── VoiceButton.tsx      # 语音按钮
│   └── MessageBubble.tsx    # 消息气泡
├── screens/            # 页面
│   ├── HomeScreen.tsx       # 主页面
│   ├── SettingsScreen.tsx   # 设置页面
│   ├── AISettingsScreen.tsx # AI设置页面
│   └── LanguageSettingsScreen.tsx # 语言设置
├── services/           # 服务
│   ├── aiService.ts         # AI对话服务
│   └── voiceService.ts      # 语音识别服务
├── store/              # 状态管理
│   ├── dollStore.ts         # 人物配置状态
│   └── chatStore.ts         # 聊天状态
├── i18n/               # 多语言
│   └── index.ts             # 翻译配置
├── hooks/              # 自定义Hooks
│   └── useTranslation.ts    # 翻译Hook
└── types/              # 类型定义
    └── index.ts
```

## 快速开始

### 1. 安装依赖

```bash
cd packages/apps/rn
pnpm install
```

### 2. 配置 EAS (Expo Application Services)

在运行 GitHub Actions 之前，需要先配置 EAS 项目：

```bash
# 登录 Expo 账号
npx eas login

# 配置 EAS 项目
npx eas build:configure
```

执行后会自动在 `app.json` 中添加 `extra.eas.projectId`。

### 3. 启动开发服务器

```bash
# 使用Expo Go
pnpm start

# iOS模拟器
pnpm ios

# Android模拟器
pnpm android
```

## 打包发布

### 使用 EAS Build（推荐）

1. 确保已登录 Expo 账号并配置项目
```bash
eas login
eas build:configure
```

2. 构建 Android APK
```bash
# 预览版
pnpm build:android

# 生产版
eas build --platform android --profile production
```

3. 构建 iOS App
```bash
# 预览版
pnpm build:ios

# 生产版（需要Apple开发者账号）
eas build --platform ios --profile production
```

### 使用 GitHub Actions 自动构建

项目已配置 GitHub Actions 工作流：

- **Android**: `.github/workflows/build-android.yml`
- **iOS**: `.github/workflows/build-ios.yml`

#### 配置步骤

1. 在 GitHub 仓库 Settings → Secrets 中添加以下 Secrets：
   - `EXPO_TOKEN` - Expo 访问令牌（从 https://expo.dev/settings/access-tokens 获取）

2. 确保 `app.json` 中的 `extra.eas.projectId` 已设置为正确的值：
   ```json
   {
     "expo": {
       "extra": {
         "eas": {
           "projectId": "your-actual-project-id"
         }
       }
     }
   }
   ```

3. 推送代码到 main 分支会自动触发构建

4. 手动触发构建：
   - 进入 Actions 页面
   - 选择工作流
   - 点击 "Run workflow"
   - 选择构建配置（development/preview/production）

## 自定义配置

### 修改卡通人物外观

在设置页面可以修改：
- 名字
- 发色（金色、红色、青色等）
- 肤色（白皙、自然、健康等）
- 眼睛颜色（蓝色、绿色、棕色等）
- 服装颜色（粉色、红色、蓝色等）
- 性格类型

### 配置 AI 模型

1. 进入设置 → AI模型设置
2. 选择 AI 提供商：
   - **通义千问** (推荐国内用户) - https://dashscope.aliyun.com/
   - **OpenAI** - https://platform.openai.com/api-keys
3. 输入 API Key
4. 选择模型版本

### 切换语言

1. 进入设置 → 语言设置
2. 选择 **简体中文** 或 **English**
3. 语言会立即切换

### 添加新的动作

在 `src/types/index.ts` 中添加新的 AnimationType：

```typescript
export type AnimationType = 
  | 'idle' 
  | 'talking' 
  | 'dancing' 
  | 'happy' 
  | 'waving' 
  | 'thinking'
  | 'your-new-action';  // 添加新动作
```

然后在 `DollCharacter.tsx` 中实现动画效果。

## 添加多语言翻译

在 `src/i18n/index.ts` 中添加新的翻译键：

```typescript
export const translations = {
  zh: {
    // ... 现有翻译
    yourNewKey: '你的翻译',
  },
  en: {
    // ... 现有翻译
    yourNewKey: 'Your translation',
  },
};
```

在组件中使用：
```typescript
const { t } = useTranslation();
<Text>{t('yourNewKey')}</Text>
```

## 注意事项

1. **语音识别** - 需要设备支持语音识别功能
2. **iOS构建** - 需要 Apple 开发者账号才能构建生产版本
3. **权限** - 首次使用需要授予麦克风权限
4. **EAS配置** - 使用 GitHub Actions 前必须先在本地运行 `eas build:configure` 获取 projectId

## 常见问题

### Q: GitHub Actions 报错 "Invalid UUID appId"
A: 需要在 `app.json` 中设置正确的 `extra.eas.projectId`。运行 `eas build:configure` 会自动配置。

### Q: 如何获取 Expo Token？
A: 访问 https://expo.dev/settings/access-tokens 创建新的访问令牌。

### Q: 支持哪些 AI 模型？
A: 目前支持通义千问 (Qwen) 和 OpenAI (GPT)。通义千问对中文支持更好，推荐国内用户使用。

## 许可证

MIT
