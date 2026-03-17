# AI Doll - React Native App

一个可爱的AI卡通人物语音对话应用。

## 功能特性

- 🤖 **AI对话** - 与可爱的卡通人物进行语音对话
- 🎨 **自定义外观** - 设置人物的发色、肤色、眼睛颜色和服装
- 🎭 **多种性格** - 可爱、性感、调皮、优雅四种性格可选
- 🎤 **语音输入** - 按住底部按钮说话，松开发送
- 💃 **动作互动** - 让卡通人物跳舞、挥手等
- 🔊 **语音播报** - AI回复会自动语音播报

## 技术栈

- React Native + Expo
- TypeScript
- Zustand (状态管理)
- React Navigation
- React Native SVG (卡通人物绘制)
- React Native Voice (语音识别)
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
│   └── SettingsScreen.tsx   # 设置页面
├── services/           # 服务
│   ├── aiService.ts         # AI对话服务
│   └── voiceService.ts      # 语音识别服务
├── store/              # 状态管理
│   ├── dollStore.ts         # 人物配置状态
│   └── chatStore.ts         # 聊天状态
└── types/              # 类型定义
    └── index.ts
```

## 快速开始

### 1. 安装依赖

```bash
cd packages/apps/rn
pnpm install
```

### 2. 配置环境变量（可选）

如需使用OpenAI API，在 `app.json` 的 `extra` 中添加：

```json
{
  "expo": {
    "extra": {
      "openaiApiKey": "your-api-key"
    }
  }
}
```

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

### 使用EAS Build（推荐）

1. 登录Expo账号
```bash
eas login
```

2. 配置项目
```bash
eas build:configure
```

3. 构建Android APK
```bash
# 预览版
pnpm build:android

# 生产版
eas build --platform android --profile production
```

4. 构建iOS App
```bash
# 预览版
pnpm build:ios

# 生产版（需要Apple开发者账号）
eas build --platform ios --profile production
```

### 使用GitHub Actions自动构建

项目已配置GitHub Actions工作流：

- **Android**: `.github/workflows/build-android.yml`
- **iOS**: `.github/workflows/build-ios.yml`

#### 配置步骤

1. 在GitHub仓库设置中添加以下Secrets：
   - `EXPO_TOKEN` - Expo访问令牌（从 https://expo.dev/settings/access-tokens 获取）

2. 推送代码到main分支会自动触发构建

3. 手动触发构建：
   - 进入Actions页面
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

### 添加新的动作

在 `src/types/index.ts` 中添加新的AnimationType：

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

## 注意事项

1. **语音识别** - 需要设备支持语音识别功能
2. **iOS构建** - 需要Apple开发者账号才能构建生产版本
3. **权限** - 首次使用需要授予麦克风权限

## 许可证

MIT
