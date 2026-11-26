# 每日发疯文学文章 - 执行记录

## 2026-11-25
- 文章：`blog-src/source/_posts/crazy-embedded-debug-2026-11-25.md`
- 标题：谁懂啊！！这块板子它自己在发疯！！我比它更疯！！！
- 题材：嵌入式调试踩坑（浮空输入导致设备偶发异常）
- 状态：hexo generate 通过；git push 成功（commit 8ebcdbe）；Deploy to GitHub Pages 工作流 completed / success
- 备注：当天已存在一篇 GitHub Actions 主题发疯文，本篇特意换了题材避免重复。后续注意继续轮换题材与标题。

## 2026-11-25（第二次触发）
- 文章：`blog-src/source/_posts/crazy-express-parcel-2026-11-25.md`
- 标题：谁懂啊！！！我的快递成精了！！它们在我家门口开全体会议！！！！
- 题材：生活琐事 / 双十一后快递成山与拆箱崩溃（与已有嵌入式、GitHub Actions 题材均不重复）
- 状态：hexo generate 通过；commit ee643c3；Deploy to GitHub Pages 工作流 completed / success
- 备注：github.com:443 直连超时，改用本地转发到可用 GitHub IP + OpenSSL TLS 后端完成推送；后续若再遇网络问题可参考。第 7 步“机械小兽状态”无历史定义，按默认理解生成并上传了当日机械小兽状态图到资料库。
- 提醒：同一天二次触发导致同日两篇，后续如按日调度建议避免重复触发。

## 2026-11-26
- 文章：`blog-src/source/_posts/crazy-requirement-change-2026-11-26.md`
- 标题：谁懂啊！！！需求又双叒改了！！！我整个人已经编译失败了！！！
- 题材：工作吐槽 / 临时需求变更（与已有嵌入式调试、GitHub Actions、快递题材均不重复）
- 状态：hexo generate 通过；commit 57dca0b；push 直连成功；Deploy to GitHub Pages 工作流 completed / success；文章 URL 返回 HTTP 200
- 注意：工作区存在未跟踪的 `.workbuddy/`，为避免把内部记录推到公开仓库，本次只暂存并提交了新文章，未执行 `git add .` 全量添加。后续沿用此做法。
