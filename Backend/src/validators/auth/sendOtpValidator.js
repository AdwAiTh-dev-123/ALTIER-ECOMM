export const validateSendOtp = (req,res,next) => {
    const {email} = req.body;

    if(!email){
        return res.status(400).json({
            success:false,
            message:"Email address is required"
        })
    }

    const trimmedEmail = email.toLowerCase().trim();
    const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(trimmedEmail)){
        return res.status(400).json({
            success:false,
            message:"Please provide a valid email address"
        })
    }


    req.body.email = trimmedEmail;
    next()


}