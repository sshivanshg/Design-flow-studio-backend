# DesignFlow Studio Backend

This is the backend API for DesignFlow Studio, built with Node.js and Express.js.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote instance)
- npm or yarn package manager

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/designflowstudio
   JWT_SECRET=your_jwt_secret_key_here
   ```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
└── server.js       # Main application file
```

## API Endpoints

- `GET /`: Welcome message
- More endpoints will be added as the project develops

## Technologies Used

- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- bcryptjs for password hashing 