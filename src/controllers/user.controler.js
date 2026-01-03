import { asyncHandeler } from "../utils/asyncHandeler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandeler( async (req, res) => {
    // Steps--
    // get user details from frontend
    // validation- not empty
    // check if user already exists: username, email
    // checkfor images, checkfor avatar
    // upload them to cloudinary, avatar
    // create a user object- create entry in db
    // remove password & refresh token field from response
    // check for user creation
    // return res.

    const {fullName, username, email, password} =  req.body
    // console.log("email: ", email)
    // if (fullName === "") {
    //     throw new apiError(400, "fullName is required")
    // }

    // next is better & industry is standard

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "all fields are required");

    };
    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    if(existedUser) {
        throw new apiError(409, "User with email or username already exists")
    };
     const avatarLocalPath = req.files?.avatar[0]?.path;
    //  const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // const avatarLocalPath = req.files?.avatar?.[0]?.path || null;

    // let avatarLocalPath;
    // if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
    //     avatarLocalPath = req.files.avatar[0].path
        
    // }

     const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

    // let coverImageLocalPath;
    // if (req.file && Array.isArray(req.file.coverImage) && req.file.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
        
    // }


    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file is required")
    };
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar) {
        throw new apiError(400, "user avatar file is required last");
    }

    const user = await User.create( {
        fullName,
        avtar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user" )
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registor successfully")
    )


    res.status(200).json({
        messege: "ok"
    })
})

export {registerUser}

