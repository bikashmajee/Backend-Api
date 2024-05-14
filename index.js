const dotenv = require('dotenv')
dotenv.config()
const { connectDB } = require("./db/connection.js")
const { app } = require('./app.js')
const port = process.env.PORT

connectDB()
    .then(() => {
        app.listen(port || 8000, () => {
            console.log(`Server is running at port : ${port}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!!  ", err);
    })