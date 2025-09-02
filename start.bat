@echo off
setlocal

:: Check if node_modules folder exists
if not exist "node_modules" (
    echo node_modules folder not found. Running npm install...
    npm install
)

:: Start the server
echo Starting server...
node server.js
