class apiResponse {
    constructor(statusCode, data, message = "Success") {
        this.data = data
        this.messege = messege
        this. statusCode = statusCode
        this.success = statusCode < 400
    }
}
