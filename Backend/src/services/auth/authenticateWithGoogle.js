import { OAuth2Client } from "google-auth-library";
import User from "../../models/User.js";
import generateToken from "../../utils/tokenHelper.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authenticateWithGoogle = async (idToken) => {
    const tokenVerify = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = tokenVerify.getPayload();
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
        if (user.isBlocked) {
            const err = new Error("Your account has been suspended by an administrator");
            err.statusCode = 403;
            throw err;
        }

        if (!user.googleId) {
            user.googleId = googleId;
            if (!user.avatar) user.avatar = picture;
            await user.save();
        }
    } else {
        user = await User.create({
            name,
            email: normalizedEmail,
            googleId,
            avatar: picture,
            role: "customer",
        });
    }

    const token = generateToken(user);
    return {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        token,
    };
};

export default authenticateWithGoogle;
