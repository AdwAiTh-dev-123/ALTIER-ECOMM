import { OAuth2Client } from "google-auth-library";
import User from "../../models/User.js";
import generateToken from "../../utils/tokenHelper.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
          message: "Your account has been suspended by an administrator",
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

export default googleAuth;
