// Role-based access control utilities
export type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'ORG_ADMIN' | 'STAFF' | 'VOLUNTEER' | 'SPONSOR' | 'USER';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
    SUPER_ADMIN: ['*'], // Full access
    ADMIN: ['*'],       // Full access
    ORG_ADMIN: ['projects.view', 'campaigns.view', 'donations.self', 'profile'],
    STAFF: ['projects.view', 'camps.view', 'campaigns.view', 'profile'],
    VOLUNTEER: ['projects.view', 'campaigns.view', 'profile'],
    SPONSOR: ['projects.view', 'campaigns.view', 'donations.self', 'profile'],
    USER: ['projects.view', 'campaigns.view', 'donations.self', 'profile'], // Regular user access
};

// Check if role has a specific permission
export function hasPermission(roleCode: RoleCode | string, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[roleCode as RoleCode] || [];

    // Full access
    if (permissions.includes('*')) return true;

    // Exact match
    if (permissions.includes(permission)) return true;

    // Check for wildcard (e.g., 'projects' matches 'projects.view')
    const [category] = permission.split('.');
    if (permissions.includes(category)) return true;

    return false;
}

// Check if user is admin
export function isAdmin(roleCode: string): boolean {
    return roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN';
}

// Check if user can manage (create/edit/delete)
export function canManage(roleCode: string, resource: string): boolean {
    if (isAdmin(roleCode)) return true;
    return hasPermission(roleCode, `${resource}.manage`);
}

// Check if user can view
export function canView(roleCode: string, resource: string): boolean {
    if (isAdmin(roleCode)) return true;
    return hasPermission(roleCode, `${resource}.view`) || hasPermission(roleCode, resource);
}

// Get visible tabs for a role
export function getVisibleTabs(roleCode: string): string[] {
    const allTabs = ['home', 'projects', 'campaigns', 'organizations', 'users', 'profile'];

    if (isAdmin(roleCode)) return allTabs;

    const visibleTabs = ['home', 'profile'];

    if (canView(roleCode, 'projects')) visibleTabs.push('projects');
    if (canView(roleCode, 'campaigns')) visibleTabs.push('campaigns');
    if (hasPermission(roleCode, 'organizations')) visibleTabs.push('organizations');
    if (hasPermission(roleCode, 'users')) visibleTabs.push('users');

    return visibleTabs;
}
