const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/tokenHelper");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Name,email and password is required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
    });

    const token = generateToken(newUser);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const findUser = await User.findOne({ email }).select("+password");

    if (!findUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (findUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account access has been restricted by an administrator",
      });
    }

    const token = generateToken(findUser);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        role: findUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

const logOut = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google authentation token is required",
      });
    }

    const tokenVerify = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = tokenVerify.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Account access has been restricted",
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar) {
          user.avatar = picture;
          await user.save();
        }
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        googleId,
        avatar: picture,
        role: "customer",
      });
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      message: "Successfully authenticatied with Google",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.avatar,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { register, login, getMe, logOut, googleAuth};
