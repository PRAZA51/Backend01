class apiResponse {
    constructor(statusCode, data, messege = "Success") {
        this.data = data
        this.messege = messege
        this. statusCode = statusCode
        this.success = statusCode < 400
    }
}

export {apiResponse}
