# Apple OAuth 配置指南

## 📋 概述
本指南将帮助你在 Apple Developer Account 中配置 Sign in with Apple，以实现 MacroDay 应用的 Apple 登入功能。

---

## 🔧 完整配置步骤

### Step 1: 登录 Apple Developer Account
1. 访问 [https://developer.apple.com/account](https://developer.apple.com/account)
2. 用你购买的 Apple Developer 账户登录
3. 导航到 **Certificates, Identifiers & Profiles** > **Identifiers**

---

### Step 2: 创建或选择 Service ID

**如果你还没有 Service ID：**

1. 点击右上角的 **+** 图标
2. 选择 **Service IDs**，点击 **Continue**
3. 填写信息：
   - **Description**: `MacroDay Web`
   - **Identifier**: `com.fuelweek.macroday` （重要：必须是唯一的，反向域名格式）
4. 点击 **Continue** 然后 **Register**

**如果你已有 Service ID：**

1. 在 Identifiers 列表中找到它
2. 点击选择

---

### Step 3: 启用 Sign in with Apple

1. 选中你的 Service ID
2. 勾选 **Sign in with Apple**
3. 点击 **Configure**
4. 在弹出窗口中：
   - 选择 **Primary App ID**（如果没有，先创建一个 App ID）
   - 在 **Domains** 中添加：`macroday1.vercel.app`
   - 在 **Return URLs** 中添加：
     ```
     https://macroday1.vercel.app/api/auth/callback/apple
     ```
5. 点击 **Save** 和 **Continue**
6. 点击 **Done** 返回

---

### Step 4: 创建 Private Key

1. 导航到 **Keys** 部分
2. 点击右上角的 **+** 图标
3. 填写信息：
   - **Key Name**: `MacroDay Web Key`
4. 勾选 **Sign in with Apple**
5. 点击 **Configure**
6. 选择之前创建的 Service ID
7. 点击 **Save**
8. 点击 **Continue**
9. **立即下载** `.p8` 文件（重要！稍后无法重新下载）

---

### Step 5: 获取 Credentials

#### APPLE_CLIENT_ID
从 Service ID 的 **Identifier** 字段复制，格式如：
```
com.fuelweek.macroday
```

#### APPLE_CLIENT_SECRET
这是最复杂的部分。你需要将 `.p8` 文件内容转换为正确的格式：

**步骤：**

1. 用文本编辑器打开 `.p8` 文件
2. 复制整个内容（包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`）
3. 在 JWT 创建工具中使用，或按以下方式格式化：

```
-----BEGIN PRIVATE KEY-----
MIGVMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
...（中间内容）...
...
-----END PRIVATE KEY-----
```

**但在环境变量中，需要处理换行符：**

选项 A（推荐）：使用 Node.js 脚本生成 JWT（在下面 Step 6 中）

选项 B：替换换行符为 `\n`，例如：
```
-----BEGIN PRIVATE KEY-----\nMIGVMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...\n-----END PRIVATE KEY-----
```

---

### Step 6: 生成 Apple OAuth JWT（最佳实践）

Apple OAuth 需要一个动态生成的 JWT 作为 `client_secret`。最简单的方式是使用 NextAuth 自动处理。

但如果你需要手动创建 JWT，可以使用这个 Node.js 脚本：

```javascript
const crypto = require('crypto');
const fs = require('fs');

// 从 .p8 文件读取
const privateKey = fs.readFileSync('./AuthKey_XXXXX.p8', 'utf8');

// JWT 配置
const claims = {
  iss: '你的Team ID',  // 在 Account > Membership 中找
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 15777000, // 6 个月有效期
  aud: 'https://appleid.apple.com',
  sub: 'com.fuelweek.macroday' // 你的 Service ID
};

// 手动签名（如果你知道如何做）
// 或使用 npm package: jsonwebtoken
```

**简化方式（推荐）：**

NextAuth 的 AppleProvider 会自动为你处理 JWT 生成，只需提供：
- `clientId`: Service ID（com.fuelweek.macroday）
- `clientSecret`: `.p8` 文件的完整内容（替换换行符为 `\n`）

---

### Step 7: 配置 Vercel 环境变量

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 选择 `MacroDay` 项目
3. 点击 **Settings** > **Environment Variables**
4. 添加以下变量：

| 变量名 | 值 | 示例 |
|------|---|-----|
| `APPLE_CLIENT_ID` | Service ID | `com.fuelweek.macroday` |
| `APPLE_CLIENT_SECRET` | 私钥内容（换行符为\n） | （下面有说明） |
| `NEXTAUTH_SECRET` | 32字符随机字符串 | `$(openssl rand -base64 32)` |
| `NEXTAUTH_URL` | 应用 URL | `https://macroday1.vercel.app` |

**如何正确设置 APPLE_CLIENT_SECRET：**

```bash
# 在你的电脑上运行
cat << 'EOF'
-----BEGIN PRIVATE KEY-----
<复制整个.p8文件内容>
-----END PRIVATE KEY-----
EOF
```

然后：
1. 复制整个输出（包括 BEGIN/END 行）
2. 在 Vercel 环境变量中，替换所有换行符为 `\n`
3. 或者，可以直接粘贴多行（Vercel 会自动处理）

---

### Step 8: 生成 NEXTAUTH_SECRET

在本地运行：
```bash
openssl rand -base64 32
```

复制输出作为 `NEXTAUTH_SECRET` 的值。

---

### Step 9: 部署和测试

```bash
# 提交代码
git push origin main

# Vercel 会自动部署
# 访问 https://macroday1.vercel.app
# 检查 /auth/signin 页面是否显示 "Sign in with Apple"
```

---

## ✅ 验证清单

- [ ] Service ID 已创建
- [ ] Sign in with Apple 已启用
- [ ] Domains 包含 `macroday1.vercel.app`
- [ ] Return URLs 包含 `https://macroday1.vercel.app/api/auth/callback/apple`
- [ ] Private Key (.p8) 已下载并保存
- [ ] APPLE_CLIENT_ID 已在 Vercel 环境变量中设置
- [ ] APPLE_CLIENT_SECRET 已在 Vercel 环境变量中设置（with `\n` for line breaks）
- [ ] NEXTAUTH_SECRET 已生成并设置
- [ ] NEXTAUTH_URL 已设置为 `https://macroday1.vercel.app`
- [ ] 部署后可以在 signin 页面看到 "Sign in with Apple" 选项
- [ ] Apple 登入可以成功完成整个认证流程

---

## 🐛 常见问题

### 问：如何找到我的 Team ID？
答：登录 [https://developer.apple.com/account](https://developer.apple.com/account)，点击 **Membership** 标签，Team ID 在右侧显示。

### 问：私钥丢失了怎么办？
答：你可以删除旧的 Key 并创建新的。在 Keys 中点击旧的 Key，选择 **Revoke**。

### 问：Apple 登入显示错误 "invalid_client"？
答：检查：
- [ ] Service ID 正确
- [ ] Private Key 有效且格式正确
- [ ] Redirect URL 精确匹配

### 问：如何在本地测试？
答：
1. 在 `.env.local` 中设置环境变量
2. 运行 `npm run dev`
3. 访问 `http://localhost:3000/auth/signin`
4. Apple 登入需要实际的域名和 HTTPS，本地无法完全测试，但可以在 Vercel 预览环境中测试

---

## 📚 相关资源

- [Apple Developer - Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [NextAuth.js Apple Provider Docs](https://next-auth.js.org/providers/apple)
- [Apple Developer Account](https://developer.apple.com/account)

---

**完成后，你将拥有完整的三种登入方式：**
- ✅ Google OAuth
- ✅ Apple OAuth
- ✅ Email OTP
