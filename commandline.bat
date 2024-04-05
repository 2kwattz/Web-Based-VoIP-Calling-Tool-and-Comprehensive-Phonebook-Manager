# The main purpose of this file is to start the database and NodeJs Server using a single file

@echo off

REM Set the log folder path
set /p path_input=Enter the path of the NodeJs Server: 
set logFolder= path_input

REM Create the log folder if it doesn't exist
if not exist "%logFolder%" mkdir "%logFolder%"

REM Start WampServer
start "" "C:\wamp\wampmanager.exe"

REM Set Error Folder
set errorLogFilePath=%logFolder%\server_log.txt

REM Wait for WampServer to start (adjust the sleep time if needed)
timeout /t 20

REM Change to the Node.js project directory
cd %nodeProjectPath%

REM Set Error Folder
set errorLogFilePath=%logFolder%\server_log.txt

REM Start Node.js server (replace "app.js" with your Node.js server file)
start cmd /k "cd C:\Users\2kwattz\Desktop\VMC Dashboard && nodemon src\server.js -e"
