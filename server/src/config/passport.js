import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";
import Member from "../models/member.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_SECRET",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      proxy: true,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // SECURE LINKING: Check if user exists with same email
          const existingUser = await User.findOne({ email: profile.emails[0].value });

          if (existingUser) {
            if (!existingUser.googleId) {
              existingUser.googleId = profile.id;
              await existingUser.save();
            }
            user = existingUser;
          } else {
            // NEW USER: Always student, never admin
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              role: "student", 
              accountStatus: "active",
              isVerified: true,
              password: Math.random().toString(36).slice(-16), // Random pass for oauth users
            });
            
            // Sync with Member collection
            const existingMember = await Member.findOne({ email: profile.emails[0].value });
            if (!existingMember) {
              await Member.create({
                name: profile.displayName,
                email: profile.emails[0].value
              });
            }
          }
        }

        // ACCOUNT CHECKS: Prevent login if banned
        if (user.accountStatus === "banned") {
          return done(null, false, { message: "account_banned" });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
