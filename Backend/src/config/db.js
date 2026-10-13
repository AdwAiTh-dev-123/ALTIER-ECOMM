const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()


const db_connect = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database conected successfully")
    }
    catch(err){
        console.log(err.message)
        process.exit(1)
    }
}

module.exports =  db_connect