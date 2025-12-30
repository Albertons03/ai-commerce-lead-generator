@echo off
cd /d "D:\ai-comerc-lead-generator"
echo Current directory: %CD%
echo.
echo Checking Git status...
git status
echo.
echo Attempting to push to GitHub...
git push origin main
echo.
echo Push completed. Press any key to continue...
pause