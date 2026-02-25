@echo off
echo ==========================================
echo      Pushing to Nasreen's Repo
echo ==========================================

set GIT_CMD="C:\Program Files\Git\cmd\git.exe"

echo [1/3] Creating new branch 'latest-updated-code'...
%GIT_CMD% checkout -b latest-updated-code 2>nul || %GIT_CMD% checkout latest-updated-code

echo [2/3] Adding new remote...
%GIT_CMD% remote remove nasreen_repo 2>nul
%GIT_CMD% remote add nasreen_repo https://github.com/Nasreen245345/Flood-Disaster-Management-System.git

echo [3/3] Pushing to repository...
%GIT_CMD% push -u nasreen_repo latest-updated-code

echo.
echo ==========================================
echo Done!
echo ==========================================
pause
