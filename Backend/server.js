import dotenv from "dotenv";
import app from "./src/app.js";
import db_connect from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT;

db_connect()
    .then(() => app.listen(PORT || 3000, () => console.log(`Server running on port ${PORT}`)))


