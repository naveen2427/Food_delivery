@echo off
echo =======================================================
echo     Starting FeastExpress Food Delivery Application
echo =======================================================
echo.

echo [1/2] Launching Backend Flask Server...
cd backend
start cmd /k "title FeastExpress Backend && echo Installing backend dependencies... && pip install -r requirements.txt && echo Starting Flask backend... && python app.py"
cd ..

echo [2/2] Launching Frontend React App...
cd frontend
start cmd /k "title FeastExpress Frontend && echo Installing frontend dependencies (if not done)... && npm install && echo Starting Vite development server... && npm run dev"
cd ..

echo.
echo Both servers are starting up in separate terminal windows.
echo - Backend will run at: http://localhost:5000
echo - Frontend will run at: http://localhost:5173
echo.
echo Opening browser to http://localhost:5173 in 8 seconds...
timeout /t 8 /nobreak
start http://localhost:5173
echo.
echo Setup completed. Press any key to exit this script (servers will continue running).
pause
