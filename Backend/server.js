import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT;

connectDB()
    .then(() => app.listen(PORT || 3000, () => console.log(`Server running on port ${PORT}`)))


