import express from "express";
import mongoose, { MongooseError } from "mongoose";
import passport from "passport";
import session from "express-session";
// import { MongoDBStore } from "connect-mongodb-session";
import { config } from "dotenv";
import morgan from "morgan";
import schema from "./dto.js";
import pkg from "connect-mongodb-session";
import "./passport.js";
import User from "../models/user.js";
import ensureAuthenticated from "./middleware.js";
import { hash } from "./bcrypt.js";
import http from "http";
import { Server } from "socket.io";

const MongoDBStore = pkg(session); // Destructure MongoDBStore

config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
// const MongoDBStore = require("connect-mongodb-session")(session);

app.use(morgan("dev"));
app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("./public"));

const sessionStore = new MongoDBStore({
  uri: process.env.MONGODB_URL,
  collection: "sessions",
  expires: 1000 * 60 * 60 * 24, // session expiration time (24 hours)
});

app.use(
  session({
    secret: process.env.MONGODB_URL,
    name: "websockets-api-series.session",
    resave: false, // Avoid unnecessary session re-saving
    saveUninitialized: false, // Don't store uninitialized sessions
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true for HTTPS (if running on HTTPS)
      maxAge: 1000 * 60 * 60 * 24, // 24 hours session expiration
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/login", (req, res) => {
  return res.render("login", {
    errors: undefined,
    username: "",
    password: "",
    success: false,
  });
});

app.get("/register", (req, res) => {
  return res.render("register", {
    errors: undefined,
    username: "",
    password: "",
  });
});

app.get("/", ensureAuthenticated, (req, res) => {
  return res.render("dashboard", { username: req.user.username });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const userValidation = schema.safeParse({
    username,
    password,
  });
  if (!userValidation.success) {
    const errors = userValidation.error.formErrors.fieldErrors;
    // console.log(userValidation.error.formErrors.fieldErrors);
    return res.render("register", {
      errors: errors,
      username,
      password,
    });
  }
  const hashedPassword = await hash(password, 10);

  try {
    await User.create({ username, password: hashedPassword });
    return res.render("login", {
      errors: undefined,
      username: "",
      password: "",
      success: true,
    });
  } catch (error) {
    console.log(error);
    // Possibility of unique constraint validation
    return res.render("register", {
      errors: { username: ["This user name is already taken"] },
      username,
      password,
      success: false,
    });
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/", // Redirect here if authentication succeeds
    failureRedirect: "/login", // Redirect here if authentication fails
  })
);

let users = {};

// WebSocket connection event
io.on("connection", async (socket) => {
  console.log("a user connected", socket.handshake.query.username);

  const username = socket.handshake.query.username; // Assuming username is passed as query parameter

  if (username) {
    users[socket.id] = { username, socketId: socket.id };
    io.emit(
      "updateUserList",
      Object.values(users).map((user) => user.username)
    ); // Send updated user list to clients
    console.log(`${username} connected`);
  }

  // TODO: Implement this logic
  socket.on("private message", (msg) => {
    // users[socket.id].sender = true;
    let name = msg.recipientId; // The username
    console.log(msg, users);
    let user = Object.values(users).filter((user) => user.username === name);
    console.log(user);
    // Lets search for the user in the online users object.

    socket.to(user[0].socketId).emit("private message", msg.message);
  });

  socket.on("chat message", (msg) => {
    console.log("message received: " + msg);
    // Broadcast to all clients

    socket.broadcast.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit(
      "updateUserList",
      Object.values(users).map((user) => user.username)
    );
    console.log("user disconnected");
  });
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Database connection established successfully"))
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

server.listen(4000, () => console.log("App is listening on port 4000"));
