import mongoose from "mongoose";

// This are messages sent in groups and DMs
const ChatSchema = new mongoose.Schema(
  {
    // When user initiates a chat, then a chatId is created. The two are assumed to be in a room
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;
