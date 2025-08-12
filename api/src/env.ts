export const env = {
  PORT: Number(process.env.API_PORT || 3000),
  ALLOWED_ORIGIN: process.env.API_ALLOWED_ORIGIN || "*",
  RECAPTCHA_SECRET: process.env.API_RECAPTCHA_SECRET || "",
  RATE_WINDOW_SECONDS: Number(process.env.API_RATE_WINDOW_SECONDS || 60),
  RATE_MAX: Number(process.env.API_RATE_MAX || 5),
  PB_URL: process.env.VITE_PB_URL || "http://pocketbase:8090"
};