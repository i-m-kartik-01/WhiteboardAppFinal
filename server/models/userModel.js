const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
        type: String,
        required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String
    }
,
  },
  { timestamps: true }
);


UserSchema.statics.register = async function(username, name, email,password){
    const hash = await bcrypt.hash(password, 12);

    try{
        const user = new this({
            username,
            name,
            email,
            passwordHash: hash,
        });
        const newUser = await user.save();
        return newUser;
    } catch(error){
        throw new Error("Error registering user" + error.message)
    }
}

UserSchema.statics.getUsers = async function () {
    try{
        const users = await this.find();
        return users;
    } catch(error) {
        throw new Error("Error getting users: " + error.message) ;
    }
}
UserSchema.statics.login = async function (email, password) {
  try {
    // 1. Find user by email
    const user = await this.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Compare plain password with hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // 3. Return user without password hash
    return user;

  } catch (error) {
    throw new Error("Login failed: " + error.message);
  }
};

const User = mongoose.model("Users", UserSchema);

module.exports = User

