import app from './src/app.js';
import { initDb } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Initialize DB tables
  await initDb();

  app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(` Health check available at: http://localhost:${PORT}/api/health`);
  });
};

startServer();
