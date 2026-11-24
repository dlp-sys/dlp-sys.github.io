@echo off
title 网站一键更新

echo.
echo  ==========================================
echo     个人网站一键更新
echo  ==========================================
echo.

cd /d "%~dp0"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo  [错误] 当前目录不是 Git 仓库，请把脚本放在项目根目录。
    echo.
    pause
    exit /b 1
)

echo  [1/3] 正在检查变更...
git add .
if errorlevel 1 (
    echo  [错误] git add 执行失败。
    echo.
    pause
    exit /b 1
)

git diff --cached --quiet
if %errorlevel% equ 0 (
    echo  [提示] 没有检测到文件变更，无需更新。
    echo.
    pause
    exit /b 0
)

echo  [2/3] 正在提交变更...
set "MSG=update site %date% %time%"
git commit -m "%MSG%"
if errorlevel 1 (
    echo  [错误] git commit 执行失败。
    echo.
    pause
    exit /b 1
)

echo  [3/3] 正在推送到 GitHub...
git push origin main
if errorlevel 1 (
    echo  [错误] git push 失败，请检查网络或 GitHub 登录状态。
    echo.
    pause
    exit /b 1
)

echo.
echo  ==========================================
echo     更新完成！
echo.
echo     网站:  https://dlp-sys.github.io/
echo     状态:  https://github.com/dlp-sys/dlp-sys.github.io/actions
echo.
echo     约 30 秒后刷新网站即可看到最新内容。
echo  ==========================================
echo.
pause
