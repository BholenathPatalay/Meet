import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose from "mongoose";

import connectToSocket from "./controllers/socketManage.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
  const connectDB = await mongoose.connect(process.env.MONGO_DB_URI);
  console.log(`Mongo connected to db host: ${connectDB.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log(
      `Server is running on port http://localhost:${app.get("port")}`,
    );
  });
};

start();
