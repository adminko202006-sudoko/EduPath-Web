@echo off
setlocal
pushd "%~dp0"
php artisan serve --host=0.0.0.0 --port=8000
set "EDUPATH_SERVER_EXIT=%ERRORLEVEL%"
popd
exit /b %EDUPATH_SERVER_EXIT%
