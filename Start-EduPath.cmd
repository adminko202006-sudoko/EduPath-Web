@echo off
setlocal
title EduPath - Web, API and Cloudflare
pushd "%~dp0"
echo Starting EduPath frontend, backend, and Cloudflare...
echo Keep this window open while using the system. Press Ctrl+C to stop.
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0deployment\Start-FreeDemo.ps1" %*
set "EDUPATH_EXIT_CODE=%ERRORLEVEL%"
popd
if not "%EDUPATH_EXIT_CODE%"=="0" (
    echo.
    echo EduPath could not start. Read the error above and try again.
    pause
)
exit /b %EDUPATH_EXIT_CODE%
