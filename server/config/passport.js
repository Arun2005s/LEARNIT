const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }
    
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      fullName: profile.displayName,
      username: profile.emails[0].value.split('@')[0],
      role: 'student',
      profilePicture: profile.photos[0]?.value || ''
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
  }));
} else {
  console.log('Google OAuth credentials not configured. Google sign-in will not be available.');
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
