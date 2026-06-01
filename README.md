# 简历投递记录网站

## 功能介绍

- 记录投递时间、公司名、投递职位、详情链接、投递状态和备注。
- 支持新增、修改、删除投递记录。
- 状态总览支持按状态分组折叠查看，并可点击筛选列表。
- 投递列表支持搜索、按状态筛选、导入和导出 JSON 文件。
- 导入时会与现有数据合并，避免重复丢失。

## 技术栈

- Vue 3：使用单文件组件实现页面交互。
- Vite：提供本地开发和前端生产构建。
- Node.js：提供独立服务端接口和数据文件读写。
- npm：管理依赖、构建脚本和 CLI 安装包。
- CSS3：负责页面布局、响应式和视觉样式。
- JSON 文件：用于持久化保存投递数据。

## 使用方式

### 本地开发

```bash
npm install
npm run dev
```

- `npm run dev` 启动 Vite 开发服务器。
- 访问终端输出的本地地址，通常是 `http://localhost:5173`。

### 前端构建

```bash
npm run build
```

- 这会把 Vue 前端打包到 `dist` 目录。
- 这个命令会保留，方便静态站点部署和 npm 包构建复用。

## 部署方式

当前项目拆成两部分部署：

### 1. 静态前端

把 `dist` 目录部署成静态网站即可。

```bash
npm run build
```

### 2. Node 服务端

服务端文件位于 `server/` 目录下，运行后提供：

- `/api/applications` 数据接口
- 页面静态资源服务

本地启动：

```bash
npm install
npm run start
```

- 默认端口是 `3000`。
- 可以通过环境变量指定端口，例如 `PORT=8080 npm run start`。
- 首次启动时，如果没有数据目录，会自动创建数据文件。

### 3. npm 包构建

```bash
npm run build:package
```

- 这会先执行 `npm run build`，再生成可安装的 npm 包压缩文件。
- 生成结果类似：`job-application-tracker-1.0.0.tgz`

### 4. 安装 tgz 包

如果你已经有这个文件：

```text
C:\Users\31406\Desktop\简历投递\job-application-tracker-1.0.0.tgz
```

可以这样安装并启动：

```bash
npm install -g C:\Users\31406\Desktop\简历投递\job-application-tracker-1.0.0.tgz
job-application-tracker start
```

- 安装后会得到命令 `job-application-tracker`
- `start` 会启动同一个投递记录网站
- CLI 模式下，数据默认保存到用户目录下的 `.job-application-tracker/applications.json`

