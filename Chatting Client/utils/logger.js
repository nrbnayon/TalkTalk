const logger = {
  info: (message, data) => {
    console.log(`ℹ️ [INFO] ${message}`, data || "");
  },
  error: (message, error) => {
    console.error(`❌ [ERROR] ${message}`, error || "");
  },
  debug: (message, data) => {
    console.debug(`🐞 [DEBUG] ${message}`, data || "");
  },
  warn: (message, data) => {
    console.warn(`⚠️ [WARN] ${message}`, data || "");
  },
};

export default logger;
