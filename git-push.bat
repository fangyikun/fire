@echo off
chcp 65001 >nul
echo === Git 推送脚本 ===
echo.

cd /d "%~dp0"

echo 1. 删除 Git 锁文件...
if exist ".git\index.lock" (
    del /f /q ".git\index.lock" >nul 2>&1
    echo    锁文件已删除
) else (
    echo    没有锁文件
)

echo.
echo 2. 添加所有文件...
git add .
if %errorlevel% neq 0 (
    echo    错误：添加文件失败
    pause
    exit /b 1
)
echo    ✓ 文件已添加

echo.
echo 3. 提交更改...
git commit -m "Update: 添加新功能和部署配置"
if %errorlevel% neq 0 (
    echo    错误：提交失败
    pause
    exit /b 1
)
echo    ✓ 提交成功

echo.
echo 4. 检查远程仓库...
git remote -v
if %errorlevel% neq 0 (
    echo    未配置远程仓库
    echo    请先运行: git remote add origin <你的仓库URL>
    pause
    exit /b 1
)

echo.
echo 5. 推送到远程仓库...
git push -u origin master
if %errorlevel% neq 0 (
    echo    错误：推送失败
    echo    可能需要先执行: git pull origin master --rebase
    pause
    exit /b 1
)

echo.
echo ✓✓✓ 推送成功！✓✓✓
pause
