
@echo off
title Gerenciador Financeiro

echo Iniciando Gerenciador Financeiro...

cd /d "%~dp0"

echo Iniciando Backend...
start "Backend" cmd /k "cd /d backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Iniciando Frontend...
start "Frontend" cmd /k "cd /d frontend && npm run dev"

timeout /t 3 /nobreak > nul

start http://localhost:5173

echo Sistema iniciado!
exit
