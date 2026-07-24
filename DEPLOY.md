# 内部耗材管理系统 - 独立部署指南

本指南帮助你将系统独立部署到自己的服务器上，使用自己的 Supabase 数据库，数据完全独立。

---

## 一、前置准备

你需要准备以下内容：

1. **一个 Supabase 账号** — 免费即可，访问 [https://supabase.com](https://supabase.com) 注册
2. **一个代码托管平台账号** — GitHub 或 GitLab（用于 Fork 项目）
3. **一个部署平台** — 推荐 Vercel（免费），也可用其他支持 Next.js 的平台

---

## 二、创建 Supabase 项目并初始化数据库

### 2.1 创建项目

1. 登录 Supabase 控制台，点击 **New Project**
2. 填写项目名称和数据库密码，选择就近的区域
3. 等待项目创建完成（约 1-2 分钟）

### 2.2 执行初始化 SQL

1. 进入项目后，点击左侧菜单 **SQL Editor**
2. 点击 **New query**
3. 打开项目根目录下的 `supabase-init.sql` 文件，复制全部内容
4. 粘贴到 SQL Editor 中，点击 **Run** 执行
5. 确认所有表已创建：点击左侧 **Table Editor**，应能看到以下 8 张表：
   - products、customers、suppliers
   - sales_orders、sales_order_items
   - purchase_orders、purchase_order_items
   - users

### 2.3 获取连接信息

1. 点击左侧 **Settings** → **API**
2. 记录以下信息（稍后需要配置为环境变量）：
   - **Project URL** → 即 `COZE_SUPABASE_URL`
   - **anon public** → 即 `COZE_SUPABASE_ANON_KEY`
   - **service_role secret** → 即 `COZE_SUPABASE_SERVICE_ROLE_KEY`

---

## 三、配置 Supabase 安全策略

为确保数据库安全，需要关闭公开访问：

1. 点击左侧 **Authentication** → **Policies**
2. 对每张表确认没有启用公开的 RLS 策略（初始化脚本未创建公开策略）
3. 本系统通过 service_role_key 在服务端直接操作数据库，不依赖 RLS

---

## 四、部署应用

### 方案 A：部署到 Vercel（推荐，最简单）

1. **Fork 项目代码**
   - 将本项目代码上传到你的 GitHub 仓库

2. **导入到 Vercel**
   - 访问 [https://vercel.com](https://vercel.com)，使用 GitHub 登录
   - 点击 **Add New** → **Project**
   - 选择你刚才的 GitHub 仓库，点击 **Import**

3. **配置环境变量**
   - 在 Import 页面展开 **Environment Variables**
   - 添加以下 3 个环境变量：

   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `COZE_SUPABASE_URL` | 你的 Supabase Project URL | 数据库地址 |
   | `COZE_SUPABASE_ANON_KEY` | 你的 anon key | 公开密钥 |
   | `COZE_SUPABASE_SERVICE_ROLE_KEY` | 你的 service_role key | 服务端密钥 |

4. **部署**
   - 点击 **Deploy**，等待构建完成（约 2-3 分钟）
   - 部署成功后会分配一个访问地址，如 `https://your-app.vercel.app`

5. **访问系统**
   - 打开分配的地址
   - 使用默认管理员账号登录：`admin` / `88888888`
   - 登录后请立即在"用户管理"中修改密码或创建新管理员账号

### 方案 B：部署到自有服务器（Docker）

1. **准备服务器**
   - 需要安装 Docker 和 Docker Compose
   - 开放 3000 端口（或你选择的端口）

2. **创建 Dockerfile**

   项目根目录下创建 `Dockerfile`：

   ```dockerfile
   FROM node:20-alpine AS base
   
   FROM base AS deps
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN corepack enable pnpm && pnpm install --frozen-lockfile
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN corepack enable pnpm && pnpm run build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

3. **构建并运行**

   ```bash
   # 构建镜像
   docker build -t inventory-system .
   
   # 运行容器
   docker run -d \
     --name inventory \
     -p 3000:3000 \
     -e COZE_SUPABASE_URL="你的Supabase URL" \
     -e COZE_SUPABASE_ANON_KEY="你的anon key" \
     -e COZE_SUPABASE_SERVICE_ROLE_KEY="你的service_role key" \
     inventory-system
   ```

4. **访问系统**
   - 打开 `http://你的服务器IP:3000`
   - 使用默认管理员账号登录

### 方案 C：部署到自有服务器（Node.js 直接部署）

1. **安装 Node.js 20+**

2. **上传代码**

   ```bash
   # 将项目代码上传到服务器
   scp -r ./inventory-system user@your-server:/home/user/
   ```

3. **安装依赖并构建**

   ```bash
   cd /home/user/inventory-system
   npm install -g pnpm
   pnpm install
   pnpm run build
   ```

4. **配置环境变量**

   ```bash
   # 创建 .env 文件
   cat > .env << 'EOF'
   COZE_SUPABASE_URL=你的Supabase URL
   COZE_SUPABASE_ANON_KEY=你的anon key
   COZE_SUPABASE_SERVICE_ROLE_KEY=你的service_role key
   NODE_ENV=production
   EOF
   ```

5. **启动服务**

   ```bash
   # 直接启动
   pnpm run start
   
   # 或使用 pm2 守护进程
   npm install -g pm2
   pm2 start pnpm --name "inventory" -- start
   pm2 save
   pm2 startup
   ```

6. **配置 Nginx 反向代理**（可选）

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## 五、环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `COZE_SUPABASE_URL` | 是 | Supabase 项目 URL，格式如 `https://xxxx.supabase.co` |
| `COZE_SUPABASE_ANON_KEY` | 是 | Supabase anon/public 密钥 |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | 是 | Supabase service_role 密钥，用于服务端操作数据库 |
| `DEPLOY_RUN_PORT` | 否 | 服务监听端口，默认 5000（本平台专用） |

---

## 六、自定义管理员账号

默认创建的管理员账号为 `admin`，密码为 `88888888`。

**强烈建议登录后立即修改**：
1. 使用默认账号登录系统
2. 进入"用户管理"模块
3. 点击管理员用户的"修改全部"按钮
4. 修改用户名和密码

**如需在 SQL 中自定义初始账号**，修改 `supabase-init.sql` 文件末尾的 INSERT 语句：
```sql
-- 将下面这行的用户名和密码改成你想要的
INSERT INTO users (username, password_hash, display_name, role)
VALUES (
  '你的用户名',
  crypt_hash('你的密码'),
  '管理员',
  'admin'
) ON CONFLICT (username) DO NOTHING;
```

---

## 七、数据备份

### 自动备份（Supabase Pro 计划）
Supabase Pro 计划自动提供每日备份，可在 Settings → Database → Backups 中恢复。

### 手动备份
1. 在 Supabase 控制台，点击 **Database** → **Backups**
2. 或使用 `pg_dump` 命令行工具导出：
   ```bash
   pg_dump "postgresql://postgres:[密码]@db.[项目ID].supabase.co:5432/postgres" > backup.sql
   ```

---

## 八、常见问题

### Q: 部署后访问报 500 错误？
A: 检查环境变量是否正确配置，特别是三个 Supabase 相关变量是否都已设置。

### Q: 登录后页面空白？
A: 确认数据库初始化 SQL 已成功执行，users 表中存在管理员记录。

### Q: 如何添加新的 Supabase 项目（多人独立使用）？
A: 每个人重复"二、创建 Supabase 项目"步骤，每个人创建自己的 Supabase 项目，执行 `supabase-init.sql`，然后在各自的部署中配置各自的 Supabase 连接信息。

### Q: 数据库表结构更新了怎么办？
A: 如果项目代码更新涉及数据库结构变更，需要手动在 Supabase SQL Editor 中执行对应的 ALTER TABLE 语句。
