@echo off
setlocal

:: Check if node_modules folder exists
if not exist "node_modules" (
    echo node_modules folder not found. Running npm install...
    npm install
	pause
	node server.js
) else (

:: Start Up Server
node server.js
);