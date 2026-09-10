@echo off
cd /d "%~dp0.."
echo PrizeNine 초기 설정을 시작합니다.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\scripts\setup-automation-gui.ps1"
if errorlevel 1 pause
