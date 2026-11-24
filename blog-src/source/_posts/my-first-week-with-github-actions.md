---
title: 用 GitHub Actions 实现博客自动部署
date: 2026-11-24 17:00:00
categories:
  - 技术
tags:
  - GitHub Actions
  - GitHub Pages
  - CI/CD
---

记录一下这个博客的自动部署是怎么搭起来的。

## 整体思路

```
本地写文章 → git push → GitHub Actions 触发 → 构建 Hexo → 部署到 Pages
```

Push 之后的一切都在云端自动完成，本地不需要手动生成静态文件。

## 关键配置

### 1. Pages 来源设为 GitHub Actions

在仓库 `Settings → Pages → Build and deployment` 里，把 Source 选成 **GitHub Actions**。这一步是前提。

### 2. 工作流文件

在 `.github/workflows/deploy.yml` 里定义构建和部署两个任务：

```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
        working-directory: blog-src
      - run: npx hexo generate
        working-directory: blog-src
      - uses: actions/upload-pages-artifact@v3
  deploy:
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
```

### 3. 权限

一定要在 workflow 里声明这几个权限，否则部署会失败：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## 踩过的坑

- **GitHub Pages 404**：仓库名必须是 `用户名.github.io`，且 Pages 来源要选对。
- **Actions 没有触发**：确认工作流文件路径正确、分支名匹配（这里是 `main`）。
- **样式丢失**：Hexo 的 `root` 要配成 `/blog/`，否则资源路径找不到。

## 总结

配置一次，之后专心写内容就好。自动化带来的省心，远大于初次配置花的时间。
