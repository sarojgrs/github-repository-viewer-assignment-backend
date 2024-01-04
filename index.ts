import fastify from "fastify";
import dotenv from "dotenv";
import fastifyCors from "@fastify/cors";

const app = fastify();

dotenv.config();

// Import and register the GitHub routes
import githubRoutes from "./routes/githubRoutes";
app.register(githubRoutes);

const allowedOrigins = ["http://localhost:3000"];
// Register the fastify-cors plugin
app.register(fastifyCors, {
  // origin: true, // Set to true to reflect the request origin (use specific origins if needed)
  origin: allowedOrigins,
});

//Start the server..
app.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
