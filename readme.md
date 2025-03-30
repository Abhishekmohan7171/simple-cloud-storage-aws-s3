# Simple Cloud Storage (SCS)

A simplified Amazon S3 clone built with Express.js and MongoDB.

## Overview

Simple Cloud Storage (SCS) is a web-based storage solution that allows users to store and retrieve files from a personal cloud-based storage space. This project implements core features of cloud storage systems like Amazon S3, including file versioning, searchability, and robust access control.

## Features

- **User Authentication**: Secure registration and login system
- **File Upload and Download**: Store and retrieve files with integrity protection
- **File Organization**: Organize files into directories/folders
- **File Listing and Search**: View and search files based on filenames and metadata
- **Permissions and Access Control**: Manage access with private, public, and shared settings
- **File Versioning**: Track file versions and roll back to previous versions
- **Metadata Management**: Add custom metadata and tags to files
- **File Deduplication**: Avoid storing duplicate files to maximize storage efficiency
- **Usage Analytics**: Track storage usage, file types, and access patterns

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local filesystem with Multer
- **Security**: bcrypt for password hashing, input validation

## Prerequisites

- Node.js (v14+ recommended)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/simple-cloud-storage.git
   cd simple-cloud-storage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/simple-cloud-storage
   JWT_SECRET=your_jwt_secret_key_here
   FILE_UPLOAD_PATH=./uploads
   ```

4. Create an uploads directory:
   ```bash
   mkdir -p uploads
   ```

5. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Project Structure

```
simple-cloud-storage/
├── config/
│   └── db.js                   # Database connection setup
├── controllers/
│   ├── auth.controller.js      # Authentication logic
│   ├── file.controller.js      # File operations logic
│   ├── folder.controller.js    # Folder operations logic
│   ├── analytics.controller.js # Usage analytics logic
│   └── search.controller.js    # Search functionality
├── middleware/
│   ├── auth.js                 # JWT authentication
│   ├── error.js                # Error handling
│   ├── accessTracker.js        # File access tracking
│   ├── rateLimit.js            # API rate limiting
│   └── validate.js             # Input validation
├── models/
│   ├── User.js                 # User data model
│   ├── File.js                 # File data model
│   ├── Folder.js               # Folder data model
│   └── FileAccess.js           # File access records
├── routes/
│   ├── auth.routes.js          # Authentication routes
│   ├── file.routes.js          # File operation routes
│   ├── folder.routes.js        # Folder operation routes
│   ├── analytics.routes.js     # Analytics routes
│   └── search.routes.js        # Search routes
├── services/
│   └── fileService.js          # File operation services
├── utils/
│   ├── errorResponse.js        # Error response utility
│   ├── fileUpload.js           # File upload utility with Multer
│   └── emailSender.js          # Email notification utility
├── uploads/                    # File storage directory
├── .env                        # Environment variables
├── .gitignore                  # Git ignore file
├── server.js                   # Server entry point
├── app.js                      # Express app setup
└── package.json                # Project dependencies
```

## API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: JWT token

#### Login User
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: JWT token

#### Get Current User
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Auth**: Required
- **Response**: User details

### File Endpoints

#### Upload File
- **URL**: `/api/files/upload`
- **Method**: `POST`
- **Auth**: Required
- **Body**: Form-data with file and optional metadata
- **Response**: File details

#### Get User Files
- **URL**: `/api/files`
- **Method**: `GET`
- **Auth**: Required
- **Query Params**: `folderId`, `search`, `tag`
- **Response**: List of files

#### Download File
- **URL**: `/api/files/:id/download`
- **Method**: `GET`
- **Auth**: Required
- **Response**: File download

#### Update File
- **URL**: `/api/files/:id`
- **Method**: `PUT`
- **Auth**: Required
- **Body**: Form-data with new file or metadata
- **Response**: Updated file details

#### Delete File
- **URL**: `/api/files/:id`
- **Method**: `DELETE`
- **Auth**: Required
- **Response**: Success message

#### Revert to Previous Version
- **URL**: `/api/files/:id/revert/:versionNumber`
- **Method**: `POST`
- **Auth**: Required
- **Response**: Updated file details

#### Share File
- **URL**: `/api/files/:id/share`
- **Method**: `POST`
- **Auth**: Required
- **Body**:
  ```json
  {
    "userId": "user_id_to_share_with",
    "permission": "read" // or "write"
  }
  ```
- **Response**: Updated file details

### Folder Endpoints

#### Create Folder
- **URL**: `/api/folders`
- **Method**: `POST`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "My Folder",
    "parentId": "parent_folder_id" // optional
  }
  ```
- **Response**: Folder details

#### Get Folders
- **URL**: `/api/folders`
- **Method**: `GET`
- **Auth**: Required
- **Query Params**: `parentId`
- **Response**: List of folders

#### Update Folder
- **URL**: `/api/folders/:id`
- **Method**: `PUT`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "Updated Folder Name",
    "accessLevel": "public" // private, public, or shared
  }
  ```
- **Response**: Updated folder details

#### Delete Folder
- **URL**: `/api/folders/:id`
- **Method**: `DELETE`
- **Auth**: Required
- **Response**: Success message

#### Share Folder
- **URL**: `/api/folders/:id/share`
- **Method**: `POST`
- **Auth**: Required
- **Body**:
  ```json
  {
    "userId": "user_id_to_share_with",
    "permission": "read" // or "write"
  }
  ```
- **Response**: Updated folder details

### Search Endpoint

#### Search Files and Folders
- **URL**: `/api/search`
- **Method**: `GET`
- **Auth**: Required
- **Query Params**: `query`, `type`
- **Response**: Matching files and folders

### Analytics Endpoints

#### Get Storage Analytics
- **URL**: `/api/analytics/storage`
- **Method**: `GET`
- **Auth**: Required
- **Response**: Storage usage statistics

#### Get Access Analytics
- **URL**: `/api/analytics/access`
- **Method**: `GET`
- **Auth**: Required
- **Response**: File access statistics

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation is performed on all endpoints
- Rate limiting is implemented to prevent abuse
- File access is controlled by permissions
- CORS is properly configured

## Deployment

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t simple-cloud-storage .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 simple-cloud-storage
   ```

### Using Docker Compose

1. Run the application stack:
   ```bash
   docker-compose up
   ```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License

## Acknowledgements

- This project was created as part of the Backend Engineering Launchpad program by Airtribe
- Inspired by Amazon S3's architecture and functionality