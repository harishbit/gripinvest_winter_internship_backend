# Grip Invest Platform - Separated Architecture

This project has been restructured to separate the frontend and backend into different folders for better maintainability and scalability.

## 📁 Project Structure

```
gripinvest/
├── web/                    # Frontend (Next.js)
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── lib/          # Frontend utilities
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   ├── Dockerfile        # Frontend Docker config
│   └── next.config.ts    # Next.js configuration
├── server/               # Backend (Express.js)
│   ├── src/
│   │   ├── db/          # Database schema and connection
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   └── utils/       # Backend utilities
│   ├── package.json     # Backend dependencies
│   ├── Dockerfile       # Backend Docker config
│   └── drizzle.config.ts # Database configuration
├── docker-compose.yml    # Multi-container setup
├── init.sql             # Database initialization
└── README.md            # Main documentation
```

## 🚀 Quick Start Commands

### Option 1: Using Docker (Recommended)
```bash
# Start all services (Frontend + Backend + Database)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Manual Development Setup

#### Backend (Server) Commands:
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up database (make sure MySQL is running)
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

#### Frontend (Web) Commands:
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📍 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Database**: localhost:3306

## 🔧 Environment Variables

### Backend (Server) Environment Variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=grip_invest

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Frontend (Web) Environment Variables:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Next.js Configuration
NODE_ENV=development
```

## 🐳 Docker Commands

### Build and Run All Services:
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server
docker-compose logs -f web
docker-compose logs -f mysql
```

### Individual Service Management:
```bash
# Start only database
docker-compose up mysql -d

# Start only backend
docker-compose up server -d

# Start only frontend
docker-compose up web -d

# Restart specific service
docker-compose restart server
docker-compose restart web

# Stop specific service
docker-compose stop server
```

## 🧪 Testing Commands

### Backend Testing:
```bash
cd server
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Testing:
```bash
cd web
npm test
npm run test:watch
npm run test:coverage
```

## 📊 Database Commands

```bash
# Navigate to server directory
cd server

# Push schema to database
npm run db:push

# Generate migrations
npm run db:generate

# Open Drizzle Studio (Database GUI)
npm run db:studio
```

## 🔄 Development Workflow

1. **Start Database**: `docker-compose up mysql -d`
2. **Start Backend**: `cd server && npm run dev`
3. **Start Frontend**: `cd web && npm run dev`
4. **Access Application**: http://localhost:3000

## 🏗️ Architecture Benefits

- **Separation of Concerns**: Frontend and backend are completely independent
- **Scalability**: Each service can be scaled independently
- **Technology Flexibility**: Can use different technologies for frontend/backend
- **Team Collaboration**: Different teams can work on frontend/backend separately
- **Deployment Flexibility**: Can deploy frontend and backend to different servers
- **Development Efficiency**: Faster builds and hot reloads for each service

## 📝 API Documentation

The backend API is available at `http://localhost:3001` with the following endpoints:

- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/products` - Get investment products
- `GET /api/products/:id` - Get specific product
- `GET /api/investments` - Get user investments
- `POST /api/investments` - Create investment
- `GET /api/logs` - Get transaction logs

## 🚨 Troubleshooting

### Common Issues:

1. **Port Conflicts**: Make sure ports 3000, 3001, and 3306 are available
2. **Database Connection**: Ensure MySQL container is running and healthy
3. **CORS Issues**: Check that `FRONTEND_URL` is correctly set in backend
4. **API Connection**: Verify `NEXT_PUBLIC_API_URL` is set in frontend

### Debug Commands:
```bash
# Check container status
docker-compose ps

# Check container logs
docker-compose logs [service-name]

# Check database connection
docker-compose exec mysql mysql -u root -p grip_invest

# Test API endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000
```
