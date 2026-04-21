# TechTrack — Test Credentials

## Admin Account
| Field      | Value                    |
|------------|--------------------------|
| Email      | admin@techtrack.edu      |
| Password   | Admin@123                |
| Role       | ROLE_ADMIN               |
| Access     | Full system access — loan queue, asset management, admin panel |

## Borrower Account
| Field      | Value                    |
|------------|--------------------------|
| Email      | juan@techtrack.edu       |
| Password   | User@123                 |
| Role       | ROLE_BORROWER            |
| Student ID | 2021-12345               |
| Department | Computer Science         |
| Access     | Browse assets, submit loan requests, view own loans |

## URLs
| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8080      |
| API Base | http://localhost:8080/api/v1 |

## Database
| Field    | Value                                                        |
|----------|--------------------------------------------------------------|
| Provider | Supabase (PostgreSQL 17.6)                                   |
| Host     | aws-1-ap-southeast-1.pooler.supabase.com:5432               |
| Database | postgres                                                     |
| Schema   | public (Flyway v6)                                           |
