import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Admin Schema (simple version if you don't want to import model)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "user"
  }
});

const User = mongoose.model("User", userSchema);

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected for seeding...");

    const adminExists = await User.findOne({
      email: "admin@cottonbutterflies.com"
    });

    if (adminExists) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.create({
      name: "Admin",
      email: "admin@cottonbutterflies.com",
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin created successfully:");
    console.log(admin);

    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();