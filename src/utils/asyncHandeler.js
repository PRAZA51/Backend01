const asyncHandeler = (reqHandeler) => {
    return (req, res, next) => {
        Promise.resolve(reqHandeler(req, res, next)).catch( (err) => next(err) )
    }
}

export {asyncHandeler}

// m-2
// const asyncHandelertwo = (fn) => async(req, res, next) => {
//     try{
//         await fn(req, res, next)
//     }
//     catch (error){
//         res.status(error.code || 500).json({
//             sucess: false,
//             messege: error.messege
//         })
//     }
// }




