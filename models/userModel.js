const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please Provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    // makes the password not showed up in many output
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    // makes the active not showed up in many output
    select: false,
  },
});

// PASSWORD ENCRYPTION
// document middleware to encrypt password (using pre)
userSchema.pre('save', async function (next) {
  // if password not updated and created, we do not want to encrypt the password
  if (!this.isModified('password')) return next();

  // encrypt the password (hash / hashing)
  // bcrypt.hash: 2 parameter (password, cost parameter)
  // .hash() is async version
  this.password = await bcrypt.hash(this.password, 12);

  // undefined to delete database field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // mines 1000 / 1sec because somethime saving db is take longer so token might be created first
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// start with find: select user that active
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({
    active: {
      $ne: false,
    },
  });
  next();
});

// instance method = method that will available on all docs in certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // candidate = input password, userPassword = password hashed
  // return true or false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // convert passwordChangedAt to timestamp
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp; // 300 < 500 true
  }

  // if user not changed the password return false
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // hash resetToken (encrypted)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
