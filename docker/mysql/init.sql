-- Cloud Agent Platform Database Initialization
-- Auto-migrated by GORM, this file is for manual reference

CREATE DATABASE IF NOT EXISTS cloud_agent
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cloud_agent;

-- Grant permissions
GRANT ALL PRIVILEGES ON cloud_agent.* TO 'cloudagent'@'%';
FLUSH PRIVILEGES;
