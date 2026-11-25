# IAI Request Center

Internal business request management application for INEOS Aromatics Indonesia.

IAI Request Center provides a centralized platform for managing operational service requests, including:

- Vehicle Request Management
- Extra Meal Request Management
- Approval Workflow
- Email Notification
- Dashboard & Analytics
- Request Monitoring & Reporting

## Overview

IAI Request Center was developed to replace and enhance manual request processes previously managed through Microsoft Forms and email communication.

The application provides a unified self-service portal where employees can submit requests, track approval status, receive automated notifications, and monitor request history.

## Key Features

### Vehicle Request

- Submit transportation requests
- Pickup schedule and destination management
- Passenger information
- Vehicle availability verification
- Plant Director approval workflow
- Automatic email notifications
- Request tracking and status monitoring

### Extra Meal Request

- Submit additional meal requests
- Single-day or multi-day requests
- Weekend inclusion/exclusion handling
- Quantity management per date
- Approval workflow
- Automatic email notifications
- Request history tracking

### Dashboard & Analytics

- Personal dashboard
- Request summary cards
- Status-based filtering
- Search functionality
- Admin monitoring dashboard
- Export to CSV

### Notification System

Automated email notifications for:

- Request Submitted
- Vehicle Available
- Approved
- Rejected
- Status Updates

### Multi Language Support

- Bahasa Indonesia
- English

### Theme Support

- INEOS Light Theme
- Dark Neon Theme

## Workflow

### Vehicle Request Workflow

```text
Requester
    │
    ▼
Submit Vehicle Request
    │
    ▼
Admin Vehicle Review
    │
    ├── Not Available → Rejected
    │
    └── Available
            │
            ▼
Plant Director Approval
            │
            ├── Approved
            └── Rejected
```

Vehicle requests are reviewed by Vehicle Admin before final approval by Plant Director or Delegation of Authority (DoA). 【1-9cf4d8\|43】

---

### Extra Meal Workflow

```text
Requester
    │
    ▼
Submit Extra Meal Request
    │
    ▼
Plant Director / DoA
    │
    ├── Approved
    └── Rejected
```

Extra Meal requests are submitted directly for approval without vehicle-admin style review. 【1-9cf4d8\|55】

## User Roles

### Requester

Can:

- Create Vehicle Request
- Create Extra Meal Request
- View request status
- Track approval progress
- Receive email notifications

### Vehicle Admin

Can:

- Review vehicle requests
- Set availability status
- Provide approval comments
- Correct request data
- Export request data

### Extra Meal Admin

Can:

- Review request records
- Update meal quantity
- Manage request data
- Export request data

### Plant Director / DoA

Can:

- Approve requests
- Reject requests
- Add approval notes
- Review pending requests

## Technology Stack

### Front-End

- Microsoft Power Apps

### Workflow Engine

- Microsoft Power Automate

### Database

- Microsoft SharePoint List

### Notification

- Microsoft 365 Email

### Platform

- Microsoft Power Platform

Source technologies: Power Apps, Power Automate and SharePoint List. 【1-9cf4d8\|3】

## Request Status

### Vehicle Request

| Status | Description |
|----------|-------------|
| Submitted | Request submitted |
| Pending Plant Director Approval | Vehicle available, awaiting approval |
| Approved | Approved by Plant Director |
| Rejected - Vehicle Not Available | Vehicle unavailable |

### Extra Meal Request

| Status | Description |
|----------|-------------|
| Submitted | Request submitted |
| Approved | Approved by Plant Director |
| Rejected | Rejected by Approver |

## Administration Features

### Vehicle Administration

- Record correction
- Vehicle availability update
- Approval processing
- Request cancellation
- Request deletion
- Export CSV

### Extra Meal Administration

- Quantity adjustment
- Approval processing
- Request cancellation
- Request deletion
- Export CSV

## Architecture

```text
Power Apps
      │
      ▼
Power Automate
      │
      ▼
SharePoint Lists
      │
      ▼
Email Notification
```

## Project Ownership

| Role | Owner |
|--------|--------|
| Vehicle Owner | Aris Kristanto |
| Extra Meal Owner | Defiani |
| Project Developer | Riyan Sugara |
| Application Support & Training | Bimo Nusantoro |
| Approver | Sri Aditia & DoA |

【1-9cf4d8\|2】

## Future Roadmap

- Mobile optimization
- Additional request modules
- Advanced reporting dashboard
- Integration with enterprise systems
- Enhanced approval delegation
- Audit trail enhancement

## License

Internal Application - INEOS Aromatics Indonesia

## Author

Riyan Sugara
Solution Architect / Application Developer
