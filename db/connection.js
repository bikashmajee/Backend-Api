const mongoose = require('mongoose')

const URI = process.env.DB_URL
const connectDB = async () => {
    try { 
        console.log("URI:---",URI)
        const connectionInstance = await mongoose.connect(`${URI}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

module.exports = { connectDB }