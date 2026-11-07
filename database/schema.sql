-- Road Hazard Reporting Platform - PostgreSQL Schema
-- Author: Government-Grade System Design
-- Version: 1.0

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Enable PostGIS for advanced geospatial queries
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE admin_role AS ENUM ('super_admin', 'department_head', 'field_officer', 'viewer');
CREATE TYPE report_status AS ENUM ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app');

-- ================================================
-- USERS TABLE
-- ================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ================================================
-- ADMINS TABLE
-- ================================================

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL DEFAULT 'viewer',
    department VARCHAR(255),
    permissions JSONB DEFAULT '{"can_update_status": false, "can_assign_reports": false, "can_delete_reports": false, "can_manage_admins": false}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);

-- ================================================
-- ISSUE TYPES TABLE
-- ================================================

CREATE TABLE issue_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default issue types
INSERT INTO issue_types (name, description, icon) VALUES
('Pothole', 'Road surface depression or hole', 'pothole'),
('Broken Street Light', 'Non-functional or damaged street lighting', 'light'),
('Road Crack', 'Cracks or fissures in road surface', 'crack'),
('Open Manhole', 'Uncovered or damaged manhole', 'manhole'),
('Unsafe Highway', 'General highway safety concerns', 'highway'),
('Speed Breaker Damage', 'Damaged or poorly marked speed breaker', 'speed');

-- ================================================
-- REPORTS TABLE
-- ================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_type_id INTEGER NOT NULL REFERENCES issue_types(id),
    
    -- Location information
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(10),
    
    -- Report details
    description TEXT NOT NULL,
    severity severity_level NOT NULL DEFAULT 'medium',
    image_urls TEXT[], -- Array of image URLs
    
    -- Status tracking
    status report_status DEFAULT 'submitted',
    assigned_to_admin UUID REFERENCES admins(id),
    assigned_department VARCHAR(255),
    admin_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_severity ON reports(severity);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_location ON reports(location_lat, location_lng);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to_admin);

-- Optional: PostGIS spatial index for advanced queries
-- CREATE INDEX idx_reports_location_gist ON reports USING GIST(ST_MakePoint(location_lng, location_lat));

-- ================================================
-- STATUS HISTORY TABLE (Audit Trail)
-- ================================================

CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    old_status report_status,
    new_status report_status NOT NULL,
    changed_by_admin_id UUID REFERENCES admins(id),
    comment TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_report_id ON status_history(report_id);
CREATE INDEX idx_status_history_changed_at ON status_history(changed_at DESC);

-- ================================================
-- NOTIFICATIONS TABLE
-- ================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);

-- ================================================
-- ADMIN AUDIT LOGS TABLE
-- ================================================

CREATE TABLE admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admins(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);

-- ================================================
-- REFRESH TOKENS TABLE (for JWT refresh tokens)
-- ================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure either user_id or admin_id is set, but not both
    CONSTRAINT check_token_owner CHECK (
        (user_id IS NOT NULL AND admin_id IS NULL) OR
        (user_id IS NULL AND admin_id IS NOT NULL)
    )
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_admin_id ON refresh_tokens(admin_id);

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- View: Reports with user and issue type information
CREATE VIEW reports_detailed AS
SELECT 
    r.id,
    r.user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    it.name AS issue_type,
    r.location_lat,
    r.location_lng,
    r.address,
    r.city,
    r.state,
    r.description,
    r.severity,
    r.image_urls,
    r.status,
    r.assigned_to_admin,
    a.name AS assigned_admin_name,
    r.assigned_department,
    r.admin_response,
    r.created_at,
    r.updated_at,
    r.resolved_at
FROM reports r
JOIN users u ON r.user_id = u.id
JOIN issue_types it ON r.issue_type_id = it.id
LEFT JOIN admins a ON r.assigned_to_admin = a.id;

-- View: Admin dashboard statistics
CREATE VIEW admin_dashboard_stats AS
SELECT
    COUNT(*) AS total_reports,
    COUNT(*) FILTER (WHERE status = 'submitted') AS pending_reports,
    COUNT(*) FILTER (WHERE status = 'under_review') AS under_review,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_reports,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_reports,
    COUNT(*) FILTER (WHERE severity = 'critical') AS critical_reports,
    COUNT(*) FILTER (WHERE severity = 'high') AS high_severity_reports,
    COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '24 hours') AS reports_last_24h,
    COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '7 days') AS reports_last_7d
FROM reports;

-- ================================================
-- SEED DATA (Optional - for testing)
-- ================================================

-- Create a default super admin (password: Admin@123)
-- Password hash generated with bcrypt rounds=12
INSERT INTO admins (name, email, password_hash, role, department, permissions) VALUES
('System Administrator', 'admin@gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYbK9Q8oG4e', 'super_admin', 'IT Department', 
'{"can_update_status": true, "can_assign_reports": true, "can_delete_reports": true, "can_manage_admins": true}');

-- ================================================
-- GRANTS (Adjust based on your database user)
-- ================================================

-- Example: Grant permissions to application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO road_hazard_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO road_hazard_app;
