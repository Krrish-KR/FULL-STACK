@echo off
cd /d "%~dp0"
docker compose up --build -d
if errorlevel 1 (echo Start failed. Check Docker Desktop is running. & pause & exit /b 1)
echo Open http://localhost:3000 after services are healthy.
echo Login: admin@socialflow.local / SocialFlow123!
pause
