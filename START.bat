@echo off
echo Starting CricketGPT...
echo Clearing ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
cd /d %~dp0
npm install -q
cd api && npm install -q && cd ..
cd client && npm install -q && cd ..
start "Backend" cmd /k "node api/index.js"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd client && npm start"
timeout /t 8 /nobreak >nul
start http://localhost:3000
echo CricketGPT is running!
pause
