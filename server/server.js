import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import { connectDB, disconnectDB } from "./src/config/db.js";

const PORT = process.env.PORT || process.env.port || 4000;

await connectDB();

const server = app.listen(PORT, () => {
  console.log(`FRAME server is running on port ${PORT}`);
});

// Graceful shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down server gracefully...`);
  server.close(async () => {
    console.log("HTTP server closed.");
    await disconnectDB();
    process.exit(0);
  });

  // Force shutdown after timeout if hanging
  setTimeout(() => {
    console.error("Forcefully terminating server after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
