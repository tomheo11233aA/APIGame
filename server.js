import router from './routes/userRoutes';
import express from 'express';
import mongoose from 'mongoose';


const app = express();
app.use(express.json());
app.use("/api/user",router);

mongoose.connect('mongodb+srv://phucnamvan123:tomheo11233@cluster0.f6kygyw.mongodb.net/?retryWrites=true&w=majority')
    .then(() => app.listen(3000)).then(() => console.log("DB Connected and Server Running in port 3000"))
    .catch(err => console.log(err));

// mongoose.connect('mongodb://localhost:27017/DB')
//     .then(() => app.listen(3000)).then(() => console.log("DB Connected and Server Running in port 3000"))
//     .catch(err => console.log(err));
    

