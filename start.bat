@echo off
title TaskFlow - Local Web Server
cd /d "%~dp0"

echo ===================================================
echo Starting TaskFlow on http://localhost:8000 ...
echo ===================================================
echo.

set "PY_EXE="
if exist "%LOCALAPPDATA%\Python\bin\python.exe" set "PY_EXE=%LOCALAPPDATA%\Python\bin\python.exe"
if not defined PY_EXE (
    if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
)
if not defined PY_EXE (
    if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
)
if not defined PY_EXE (
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
)
if not defined PY_EXE (
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
)

if defined PY_EXE (
    echo Using Python at: "%PY_EXE%"
    echo Opening browser to http://localhost:8000 ...
    start http://localhost:8000
    echo Server is running! Keep this window OPEN while using the app.
    echo Press Ctrl+C to stop the server when done.
    echo.
    "%PY_EXE%" -m http.server 8000
    goto finish
)

echo Python not found in standard user paths. Starting native Windows server...
start http://localhost:8000
powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8000/'); $listener.Start(); Write-Host 'Server running at http://localhost:8000. Keep this window OPEN!'; while ($listener.IsListening) { $ctx = $listener.GetContext(); $sub = $ctx.Request.Url.LocalPath.TrimStart('/'); if ([string]::IsNullOrEmpty($sub)) { $sub = 'index.html' }; $p = Join-Path (Get-Location) $sub; if (Test-Path $p -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($p); $ext = [System.IO.Path]::GetExtension($p).ToLower(); $mime = switch ($ext) { '.html' {'text/html'} '.css' {'text/css'} '.js' {'application/javascript'} '.json' {'application/json'} default {'application/octet-stream'} }; $ctx.Response.ContentType = $mime; $ctx.Response.ContentLength64 = $bytes.Length; $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) } else { $ctx.Response.StatusCode = 404 }; $ctx.Response.Close() }"

:finish
echo.
echo Server closed.
pause
