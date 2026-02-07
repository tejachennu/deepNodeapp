-- =====================================================
-- Project Ground Permissions and Related Tables
-- =====================================================

USE auth_org_db;

-- Project Ground Permissions Table
CREATE TABLE IF NOT EXISTS project_ground_permissions (
    ProjectPermissionId INT AUTO_INCREMENT PRIMARY KEY,
    ProjectId INT NOT NULL,
    PermissionType VARCHAR(100) NOT NULL,
    Description TEXT,
    AssignedToUserId INT,
    DueDate DATE,
    Status ENUM('Pending', 'InProgress', 'Submitted', 'Approved', 'Rejected') DEFAULT 'Pending',
    SubmittedDate DATETIME,
    ApprovedRejectedDate DATETIME,
    ApprovedRejectedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy INT,
    UpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProjectId) REFERENCES projects(ProjectId),
    FOREIGN KEY (AssignedToUserId) REFERENCES users(UserId),
    FOREIGN KEY (ApprovedRejectedBy) REFERENCES users(UserId),
    FOREIGN KEY (CreatedBy) REFERENCES users(UserId),
    FOREIGN KEY (UpdatedBy) REFERENCES users(UserId)
);

-- Project Ground Permission Documents Table
CREATE TABLE IF NOT EXISTS project_permission_documents (
    DocumentId INT AUTO_INCREMENT PRIMARY KEY,
    ProjectPermissionId INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FileUrl VARCHAR(500),
    FilePath VARCHAR(500),
    DocumentType VARCHAR(50),
    FileSize INT,
    MimeType VARCHAR(100),
    UploadedBy INT,
    UploadedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ProjectPermissionId) REFERENCES project_ground_permissions(ProjectPermissionId),
    FOREIGN KEY (UploadedBy) REFERENCES users(UserId)
);

-- Project Ground Permission Comments Table
CREATE TABLE IF NOT EXISTS project_permission_comments (
    CommentId INT AUTO_INCREMENT PRIMARY KEY,
    ProjectPermissionId INT NOT NULL,
    CommentText TEXT NOT NULL,
    CommentedByUserId INT NOT NULL,
    CommentedByRole VARCHAR(50),
    ParentCommentId INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProjectPermissionId) REFERENCES project_ground_permissions(ProjectPermissionId),
    FOREIGN KEY (CommentedByUserId) REFERENCES users(UserId),
    FOREIGN KEY (ParentCommentId) REFERENCES project_permission_comments(CommentId)
);

-- Assigned Project Ground Permissions Table (for multiple assignees)
CREATE TABLE IF NOT EXISTS assigned_project_permissions (
    AssignmentId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ProjectPermissionId INT NOT NULL,
    ProjectId INT NOT NULL,
    AssignedBy INT NOT NULL,
    AssignedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (UserId) REFERENCES users(UserId),
    FOREIGN KEY (ProjectPermissionId) REFERENCES project_ground_permissions(ProjectPermissionId),
    FOREIGN KEY (ProjectId) REFERENCES projects(ProjectId),
    FOREIGN KEY (AssignedBy) REFERENCES users(UserId),
    UNIQUE KEY unique_user_permission (UserId, ProjectPermissionId)
);

-- Indexes for better query performance
CREATE INDEX idx_permissions_project ON project_ground_permissions(ProjectId);
CREATE INDEX idx_permissions_status ON project_ground_permissions(Status);
CREATE INDEX idx_permissions_assigned ON project_ground_permissions(AssignedToUserId);
CREATE INDEX idx_documents_permission ON project_permission_documents(ProjectPermissionId);
CREATE INDEX idx_comments_permission ON project_permission_comments(ProjectPermissionId);
CREATE INDEX idx_assigned_user ON assigned_project_permissions(UserId);
CREATE INDEX idx_assigned_permission ON assigned_project_permissions(ProjectPermissionId);
