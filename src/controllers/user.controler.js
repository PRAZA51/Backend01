import { asyncHandeler } from "../utils/asyncHandeler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";

const generateAccessAndRefreshToken = async(userId) =>  {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}

    }
    catch {
        throw new apiError(500, "Something went wrong while generating the tokens")
    }
}

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


const loginUser = asyncHandeler(async (req, res) => {
    //  req -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    //
    
    
    const {email, username, password} = req.body;
    if(!(username || email)) {
        throw new apiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
})

if(!user) {
    throw new apiError(404, "User don't exist")
}

const isPasswordValid = await user .isPasswordCorrect(password)  //not the mongoDB User

if(!isPasswordValid) {
    throw new apiError(405, "Invalid user credentials")
}

const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

// logged In
const loggedInUser = await User.findById(User._id).select("-password -refreshToken")

const options = {
    httpOnly: true,
    secure: true
}
return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new apiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    }, "User logged In successfully")
)

})

// logged Out

const logoutUser = asyncHandeler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        }
    )
    const options = {
    httpOnly: true,
    secure: true
    }
    return res
    .status(200) 
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "user logged out"))

})

const refreshAccessToken = asyncHandeler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 
    if(!incomingRefreshToken) {
        throw new apiError(401, "unothorised request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
    
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user) {
            throw new apiError(401, "invelid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh token is invelid")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshTokenefreshToken, options)
        .json(
            new apiResponse(
                200, {accessToken, newRefreshToken}, "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.messege || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandeler( async(req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new apiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new apiResponse(200, {}, "Password change successfully"))
})

const getCurrentUser = asyncHandeler( async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched sucessfully")
})

const updateAccountDetails = asyncHandeler(async(req, res) => {
    const {fullName, email} = req.body
    if(!(fullName || email)) {
        throw new apiError(400, "All fields are required")
    }
    const user = user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json( new apiResponse(200, user, "current user fetched sucessfully"))
})

const updateUserAvatar = asyncHandeler(async( req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing while changing")     
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new apiError(400, "Error while uploading the avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }, 
        {new: true}
    ).select("-password")
    return res 
    .status(200)
    .json(
        new apiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandeler(async( req, res) => {
    const avatarLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400, "coverImage file is missing while changing")     
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading the coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, 
        {new: true}
    ).select("-password")
    return res 
    .status(200)
    .json(
        new apiResponse(200, user, "coverImage updated successfully")
    )
})

const getUserChannelProfile = asyncHandeler(async(req, res) => {
    const {username} = req.params
    if (!username) {
        throw new apiError(400, "Username is Missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel", 
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber", 
                as: "subscribedTo"
            }
        },

        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }

            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed:1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    if (!channel?.length) {
        throw new apiError(404, "channel does not exists")
    }
    return res
    .status(200)
    .json(new apiResponse(200, channel[0], "User channel featured successfully") )
})

const getWatchHistory = asyncHandeler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id", 
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }, 
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200, user[0].watchHistory, "watch history fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,


}

