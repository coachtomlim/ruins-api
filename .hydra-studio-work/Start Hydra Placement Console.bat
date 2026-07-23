@echo off
setlocal
title Hydra Boss Room Placement Console
set "APP_DIR=%~dp0"
set "PYTHON_EXE=C:\Users\Thomas\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
"%PYTHON_EXE%" "%APP_DIR%server.py" --port 5198
if errorlevel 1 pause
