import passport from "passport";
import { Strategy } from "passport-local";
import pkg from "bcryptjs";
import User from "../models/user.js";

const { compare } = pkg;
// Serialize user (store user info in session)
passport.serializeUser((user, done) => {
  done(null, user.id); // You can store the user ID in the session
});

// Deserialize user (retrieve user info from session)
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (error) {
    done(error, null);
  }
  // User.findById(id, (err, user) => {
  //   done(err, user); // Attach the user object to the request
  // });
});

passport.use(
  new Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        console.log(username, password);
        // Find user by email
        const user = await User.findOne({ username: username });
        console.log(user);
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }

        // Compare the passwords
        const isMatch = await compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user); // Authentication success
      } catch (err) {
        return done(err); // Handle errors
      }
    }
  )
);
