import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config({ override: true });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedUsers = async () => {
  await connectDB();

  try {
    try {
        await User.collection.dropIndexes();
    } catch(e) {
        console.log("Error dropping indexes:", e.message);
    }
    await User.deleteMany({});

    const users = [
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin',
      },
    ];

    for (let user of users) {
        await User.create(user);
    }

    console.log('Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding users: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
