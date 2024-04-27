@echo off
setlocal

rem Set the absolute path to the directory where your files are located
set "absolutePath=D:\se\TrackVote\WebApp"

rem Change the current directory to the specified absolute path
cd /d "%absolutePath%"

rem Start Python HTTP server
start "Python HTTP Server" cmd /c "python -m http.server 8000"

rem Start ngrok
start "Ngrok" cmd /c "ngrok http 8000"

rem Wait for both servers to start
:waitForServers
timeout /t 1 >nul

rem Check if Python HTTP server is running
netstat -ano | find "LISTENING" | find ":8000" >nul
set pythonServerRunning=%errorlevel%

rem Check if ngrok is running
ngrok status >nul
set ngrokRunning=%errorlevel%

rem If both servers are running, exit the loop
if %pythonServerRunning% equ 0 if %ngrokRunning% equ 0 goto serversStarted

rem If any server is not running, continue waiting
goto waitForServers

:serversStarted
echo Both servers are now running.


endlocal
