import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, updateAccountDetails, getUserChannelProfile } from "../controllers/user.controler.js";
import {upload} from "../middlewears/multer.middlewears.js"
import { verify } from "jsonwebtoken";
// import { JsonWebTokenError } from "jsonwebtoken";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    
    registerUser
    )

    router.route("/login").post(loginUser)
    //secure routes
    router.route("/logout").post(verifyJWT, logoutUser)
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
    router.route("/current-user").get(verifyJWT, getCurrentUser)
    router.route("/update-account").patch(verifyJWT, updateAccountDetails)
    router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
    router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
    router.route("/c/:username").get(varifyJWT, getUserChannelProfile)
    router.route("/history").get(varifyJWT, getWatchHistory)



export default router;









