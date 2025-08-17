# Quick Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - Either:
   - Local installation: [Download here](https://www.mongodb.com/try/download/community)
   - Cloud (MongoDB Atlas): [Sign up here](https://www.mongodb.com/atlas)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy the `.env` file and update it with your configuration:
```bash
cp .env.example .env
```

Edit `.env` and update:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A random secret key
- `GEMINI_API_KEY` - Your Google Gemini API key (optional, for AI features)

### 3. Start MongoDB
If using local MongoDB:
```bash
mongod
```

### 4. Run the application
```bash
npm run dev:full
```

This will start both the backend server (port 3001) and frontend (port 5173).

### 5. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running
- Check your connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change the port in `.env` file
- Or kill the process using the port

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

## Next Steps

1. Create your first user account
2. Try the AI quiz generator (requires Gemini API key)
3. Explore different quiz categories
4. Check your progress in the dashboard

## Support

If you encounter any issues, please check:
1. All prerequisites are installed
2. Environment variables are correctly set
3. MongoDB is running and accessible
4. No other services are using the required ports
