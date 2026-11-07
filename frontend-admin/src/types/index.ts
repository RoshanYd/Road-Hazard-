export interface Report {
    id: string;
    issue_type_name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
    location_lat: number;
    location_lng: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
    description: string;
    images: string[];
    created_at: string;
    updated_at: string;
    user_id: string;
    user_name: string;
    user_email: string;
    assigned_to_id?: string;
    assigned_to_name?: string;
    admin_response?: string;
}

export interface DashboardStats {
    total_reports: number;
    pending_reports: number;
    in_progress_reports: number;
    resolved_reports: number;
    rejected_reports: number;
    reports_by_severity: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    reports_by_status: {
        submitted: number;
        under_review: number;
        in_progress: number;
        resolved: number;
        rejected: number;
    };
}

export interface TrendData {
    date: string;
    count: number;
}

export interface AuditLog {
    id: string;
    admin_id: string;
    admin_name: string;
    action: string;
    report_id?: string;
    details: any;
    created_at: string;
}
