import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true},
    name: String,
    type: String,
    breed: String,
    age: Number,
    gender: String,
    avatar: { type: String, default: '/images/pet-default.jpg' },
    medical_history: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model("Pet", petSchema);