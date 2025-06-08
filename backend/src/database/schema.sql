-- Supabase Database Schema for ResearchLLM Pro

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    company VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'premium'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM Usage tracking table
CREATE TABLE public.llm_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    model_used VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    query_type VARCHAR(50) DEFAULT 'chat', -- 'chat', 'completion', 'embedding'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM Providers configuration table
CREATE TABLE public.llm_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    api_key_encrypted TEXT, -- Store encrypted API keys
    models JSONB DEFAULT '[]'::jsonb, -- Array of available models
    is_active BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User API Keys table (for users to store their own provider keys)
CREATE TABLE public.user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider_name)
);

-- Query History table
CREATE TABLE public.query_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT,
    model_used VARCHAR(100),
    provider VARCHAR(50),
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Quotas table
CREATE TABLE public.usage_quotas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL, -- 'monthly_tokens', 'daily_queries', etc.
    quota_limit INTEGER NOT NULL,
    quota_used INTEGER DEFAULT 0,
    reset_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quota_type)
);

-- Indexes for performance
CREATE INDEX idx_llm_usage_user_id ON public.llm_usage(user_id);
CREATE INDEX idx_llm_usage_created_at ON public.llm_usage(created_at);
CREATE INDEX idx_llm_usage_user_date ON public.llm_usage(user_id, created_at);

CREATE INDEX idx_query_history_user_id ON public.query_history(user_id);
CREATE INDEX idx_query_history_created_at ON public.query_history(created_at);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- LLM Usage policies
CREATE POLICY "Users can view own usage" ON public.llm_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.llm_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User API Keys policies
CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Query History policies
CREATE POLICY "Users can view own queries" ON public.query_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries" ON public.query_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage Quotas policies
CREATE POLICY "Users can view own quotas" ON public.usage_quotas
    FOR SELECT USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_providers_updated_at BEFORE UPDATE ON public.llm_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON public.user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON public.usage_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, company)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'company'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create user record
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data for testing (optional)
INSERT INTO public.llm_providers (name, models, is_active, priority) VALUES
('openai', '["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]'::jsonb, false, 1),
('anthropic', '["claude-2", "claude-3-sonnet", "claude-3-opus"]'::jsonb, false, 2),
('google', '["gemini-pro", "gemini-pro-vision"]'::jsonb, false, 3);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;