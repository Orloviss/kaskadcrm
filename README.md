# Simple React CRM

## Features
- User registration and login (JWT-based)
- Add and remove funds
- Bottom navigation bar (Главная, Заказы, Статистика)
- Mobile-first, max width 768px
- Backend: Node.js, Express, SQLite
- Frontend: React, SCSS

## Setup

### Backend
```
cd backend
npm install
```

### Frontend
```
cd frontend
npm install
```

## Running
- Start backend: `npm start` in backend
- Start frontend: `npm start` in frontend

## Deployment
- Backend and frontend are decoupled, ready for VDS deployment and custom domain. 


## Update
cd /opt/kaskadcrm
git pull
cd backend && npm install && pm2 restart kaskad-backend
cd ../frontend && npm install && npm run build
systemctl reload nginx