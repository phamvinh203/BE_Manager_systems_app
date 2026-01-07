import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import routes from "./src/routes/index.route.js";
import { connectDB } from "./src/config/db.js";
import { startMemoryLogger } from "./src/utils/memoryLogger.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors());

app.use(express.json());
app.use("/api", routes);

// if (process.env.NODE_ENV === "development") {
//   startMemoryLogger();
// }

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

