const mongoose = require('mongoose')

//connecting to db
mongoose.connect(process.env.MONGO_DB_PATH, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    autoIndex: true //  to make unique: true work at Schema in models
})