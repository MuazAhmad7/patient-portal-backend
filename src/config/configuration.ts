export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_KEY,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  ai: {
    baseUrl: process.env.AI_AGENT_BASE_URL || 'http://localhost:8000',
    geminiApiKey: process.env.GEMINI_API_KEY,
  },

  marketplace: {
    apiKey: process.env.MARKETPLACE,
    baseUrl: process.env.MARKETPLACE_BASE_URL || 'https://api.marketplace.cms.gov',
  },

  security: {
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  external: {
    apiKey: process.env.EXTERNAL_API_KEY,
    apiUrl: process.env.EXTERNAL_API_URL,
  },
});