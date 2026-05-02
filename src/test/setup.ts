import "@testing-library/jest-dom";

// Mock environment variables for tests
process.env.ENCRYPTION_MASTER_KEY = "a".repeat(64);
process.env.SESSION_SIGNING_SECRET = "test-signing-secret-that-is-long-enough";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-value";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GROQ_API_KEY = "gsk_test_key_value_here";
process.env.GEMINI_API_KEY = "AIzaSyTestKeyHere";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.INDIA_STACK_MODE = "mock";
