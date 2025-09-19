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
├── admin/                # Admin Panel (Next.js)
│   ├── app/              # Admin pages
│   ├── components/       # Admin UI components
│   ├── lib/             # Admin utilities
│   ├── package.json     # Admin dependencies
│   └── tailwind.config.ts # Admin styling config
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

#### Admin Panel Commands:
```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

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
- **Admin Panel**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Database**: localhost:3306

## 🔧 Environment Variables

### Admin Panel Environment Variables:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Next.js Configuration
NODE_ENV=development
```

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

- **Separation of Concerns**: Frontend, admin panel, and backend are completely independent
- **Admin Management**: Dedicated admin interface for product management
- **Scalability**: Each service can be scaled independently
- **Technology Flexibility**: Can use different technologies for each service
- **Team Collaboration**: Different teams can work on different services
- **Deployment Flexibility**: Can deploy services to different servers
- **Development Efficiency**: Faster builds and hot reloads for each service

## 🔐 Admin Panel Features

- **Product Management**: Create and delete investment products
- **Dashboard Analytics**: View product statistics and metrics
- **Secure Authentication**: Uses existing backend authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Immediate feedback for all operations

### Admin Panel Setup:
```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3002
```

### Admin Panel Workflow:
1. **Start Admin Panel**: `cd admin && npm run dev`
2. **Access Interface**: http://localhost:3002
3. **Login**: Use any existing user credentials from the main app
4. **Manage Products**: Create/delete investment products
5. **Monitor Analytics**: View product distribution and metrics

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

1. **Database Schema Errors (Unknown column 'role')**:
   - The database needs to be updated with the latest schema changes
   - Run the database migration commands below

2. **Admin Panel TypeScript Errors**: 
   - Ensure `tsconfig.json` has correct path mapping
   - Run `npm install` in the admin directory
   - Check that all UI components are properly installed

3. **API Connection Issues**:
   - Verify backend is running on port 3001
   - Check `NEXT_PUBLIC_API_URL` environment variable
   - Ensure CORS is properly configured

4. **Authentication Issues**:
   - Admin panel uses the same authentication as main app
   - Create a user account in the main app first
   - Use those credentials to access admin panel

### Database Migration Commands:

If you encounter "Unknown column 'role'" errors, run these commands:

```bash
# Navigate to server directory
cd server

# Push the updated schema to database
npm run db:push

# Or manually run the migration SQL
mysql -h localhost -u root -p grip_invest < drizzle/0002_add_user_role.sql
```

### Manual Database Update:

If the automated migration doesn't work, manually add the role column:

```sql
-- Connect to your database and run:
USE grip_invest;
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user';
UPDATE users SET role = 'user' WHERE role IS NULL;

-- To make a user an admin:
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

### Debug Commands:
```bash
# Check container status
docker-compose ps

# Check container logs
docker-compose logs [service-name]

# Check database connection
docker-compose exec mysql mysql -u root -p grip_invest

# Check database schema
docker-compose exec mysql mysql -u root -p -e "DESCRIBE grip_invest.users;"

# Test API endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000
```

### Quick Fix for Development:

1. **Stop the backend server**
2. **Run database migration**:
   ```bash
   cd server
   npm run db:push
   ```
3. **Restart the backend server**:
   ```bash
   npm run dev
   ```
4. **Create admin user** (optional):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
