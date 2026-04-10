@echo off
REM Legacy entrypoint. Prefer running "..\..\mapmate.bat".
call "%~dp0..\..\mapmate.bat" start docker %*

