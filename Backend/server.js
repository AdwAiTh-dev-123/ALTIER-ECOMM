const dotenv = require('dotenv')
dotenv.config()
const app = require('./src/app.js')
const db_connect = require('./src/config/db.js')


const PORT = process.env.PORT

db_connect()
    .then(() => app.listen(PORT || 3000,() => console.log(`Server running on port ${PORT}`)))


