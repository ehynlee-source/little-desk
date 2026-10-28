@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0실행.ps1"
if errorlevel 1 pause
