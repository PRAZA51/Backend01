class apiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        error = [],
        stack = ""
    ) {
        super(messege)
        this.statusCode = statusCode
        this.Date = null
        this.message = message
        this.success = false
        this.errors = errors
        if(stack) {
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {apiError}