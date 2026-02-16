-- Database Schema for QA Engine Production Code

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Files Table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'json', 'xliff', etc.
    content TEXT, -- Original content or path to storage
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translation Units Table
CREATE TABLE translation_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    context TEXT,
    notes TEXT,
    index INTEGER NOT NULL,
    metadata JSONB
);

-- QA Config Table
CREATE TABLE qa_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    config JSONB NOT NULL, -- Stores rules, ignore patterns, etc.
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom Rules Table
CREATE TABLE custom_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES qa_configs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pattern TEXT NOT NULL,
    type TEXT NOT NULL, -- 'forbidden', 'required'
    severity TEXT NOT NULL, -- 'error', 'warning', 'info'
    message TEXT
);

-- Blacklist Table
CREATE TABLE blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QA Results Table
CREATE TABLE qa_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    stats JSONB NOT NULL,
    issues JSONB NOT NULL, -- Serialized list of QAIssue
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
