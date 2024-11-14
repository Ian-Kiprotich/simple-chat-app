import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String }, // Only for group chats
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    isGroupChat: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", chatRoomSchema);
export default Room;
