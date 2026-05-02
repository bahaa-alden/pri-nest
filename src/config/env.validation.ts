type Env = Record<string, string | undefined>;

const requiredKeys = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

export const envSchema = {
  parse(config: Env): Env {
    for (const key of requiredKeys) {
      if (!config[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    return config;
  },
};
