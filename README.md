## Technology Stack

### Frontend

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Responsive Web Design

### Backend

- Node.js
- Express.js
- REST API

### Database

- PostgreSQL

### Containerization

- Docker
- Docker Compose

### Source Control

- Git
- GitHub

## Architecture

```text
┌──────────────────────┐
│ End Users            │
│ Browser (Edge/Chrome)│
└──────────┬───────────┘
           │ HTTP/HTTPS
           ▼
┌──────────────────────┐
│ IIS Reverse Proxy    │
│ Windows 11 / Server  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ React Frontend       │
│ TypeScript + Vite    │
└──────────┬───────────┘
           │ REST API
           ▼
┌──────────────────────┐
│ Node.js Backend      │
│ Express API          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PostgreSQL Database  │
└──────────────────────┘
```

## Deployment Architecture

```text
GitHub Repository
        │
        ▼
Windows 11 VM (Merak)
        │
        ▼
Docker Compose
        │
 ┌──────┴──────┐
 │             │
 ▼             ▼
Application   PostgreSQL
Container     Container
```

## Key Technical Features

- Modern React User Interface
- TypeScript-based Development
- RESTful API Architecture
- PostgreSQL Relational Database
- Dockerized Deployment
- Internal Network Hosting
- GitHub Source Control
- Scalable Modular Design
- Email Notification Integration
- Role-Based Access Control (RBAC)

## Future Enhancements

- Microsoft Entra ID (Azure AD) Authentication
- Single Sign-On (SSO)
- Audit Trail & Activity Logging
- Dashboard Analytics
- Approval Delegation
- Mobile Responsive Enhancements
- Automated Backup & Disaster Recovery

# IAI Request Center

IAI Request Center is a web-based request management platform developed for INEOS Aromatics Indonesia to streamline operational request processes such as Vehicle Requests and Extra Meal Requests.

The application is built using React, TypeScript, Node.js, Express, and PostgreSQL, providing a modern, scalable, and maintainable platform with automated workflows, approval management, notification services, and real-time request tracking.
