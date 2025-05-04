import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import OwnerRoutes from "./route/ownerRoutes.js";
import ClinicRoutes from "./route/clinicRoutes.js";
import ServiceRoutes from "./route/serviceRoutes.js";
import PetRoutes from "./route/petRoutes.js";
import AppointmentRoutes from "./route/appointmentRoutes.js";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname } from "path";
import './utils/passport-setup.js';
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import OwnerModel from "./model/Owner.js";

dotenv.config();
connectDB();

import './cron/checkAppointment.js';

const app = express();
app.use(express.json());

const allowedOrigins = [
  process.env.FRONTEND_URL_VERCEL,
  process.env.FRONTEND_URL,
  process.env.LOCAL_URL,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));

// ✅ Secure MongoDB-backed session store
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use("/logos", express.static(path.join(__dirname, "logos")));
app.use("/avatars", express.static(path.join(__dirname, "avatars")));
app.use("/pet_avatars", express.static(path.join(__dirname, "pet_avatars")));

app.use("/api", OwnerRoutes);
app.use("/api", ClinicRoutes);
app.use("/api", PetRoutes);
app.use("/api", ServiceRoutes);
app.use("/api", AppointmentRoutes);

// Google Auth Routes
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth/google/failure", session: false }), async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL_VERCEL_VERCEL}/google-auth-failure?message=Authentication failed`);
  }

  try {
    let ownerId = null;
    if (req.user.role === "owner") {
      const owner = await OwnerModel.findOne({ userId: req.user._id });
      if (owner) {
        ownerId = owner._id;
      }
    }

    const token = jwt.sign(
      { id: req.user._id, role: req.user.role, ownerId: ownerId || null },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.redirect(`${process.env.FRONTEND_URL_VERCEL}/google-auth-success?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.redirect(`${process.env.FRONTEND_URL_VERCEL}/google-auth-failure?message=Server error`);
  }
});

// Google Auth Failure Route
app.get("/auth/google/failure", (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL_VERCEL}/login?message=This email was registered manually. Please use email and password.`);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
