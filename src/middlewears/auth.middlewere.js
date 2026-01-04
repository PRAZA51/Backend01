import { apiError } from "../utils/apiError";
import { asyncHandeler } from "../utils/asyncHandeler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const  varifyJWT = asyncHandeler( async(req, resizeBy, next) => {
    try {
        req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token) {
            throw new apiError(401, "Unathorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new apiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401, error?.messege || "Invelid access token")
        
    }

}
)
