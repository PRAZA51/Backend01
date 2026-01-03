// import  mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

// const connectDB = async () => {
//     try{
//         // const connecrtionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  // ${DB_NAME}
//         const connectionInstant = await mongoose.connect(process.env.MONGODB_URI);
//         console.log(`\n MongoDB connected  !! DB Host: ${connecrtionInstant.connection.host}`);
//     }
//     catch (error) {
//         console.log("Mongodb connection error", error);
//         process.exit(1)
//     }
// }

// export default connectDB;



import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstant = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      `\nMongoDB connected !! DB Host: ${connectionInstant.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
