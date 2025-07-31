-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Since photo_user is the database owner, they should have all permissions
-- But let's ensure schema permissions are explicit
GRANT ALL ON SCHEMA public TO photo_user;
GRANT CREATE ON SCHEMA public TO photo_user;
ALTER DEFAULT PRIVILEGES FOR USER photo_user IN SCHEMA public GRANT ALL ON TABLES TO photo_user;
ALTER DEFAULT PRIVILEGES FOR USER photo_user IN SCHEMA public GRANT ALL ON SEQUENCES TO photo_user;
ALTER DEFAULT PRIVILEGES FOR USER photo_user IN SCHEMA public GRANT ALL ON FUNCTIONS TO photo_user;
