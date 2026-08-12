@echo off
chcp 65001 > nul
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%\_run.ps1" "%SCRIPT_DIR%"
if %errorlevel% neq 0 pause
pause
