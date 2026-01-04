const handleDuplicateError = (err) => {
    const errorKey = Object.keys(err.keyValue)[0]
    const errorValue = Object.values(err.keyValue)[0]
    const error = new Error(`${errorKey} of ${errorValue} already exists`)

    return {
        statusCode: 400,
        message: error.message
    }
}

const handleValidationError = (err) =>{
    const errorMessage = Object.values(err.errors).map(error => error.message)
    return {
        statusCode: 400,
        message: errorMessage[0]
    }
}

const handleCastError = (err) =>{
    const message = `${err.path} ${err.value} is invalid`
    const error = new Error(message)
    return {
        statusCode: 400,
        message: error.message
    }
}

const errorHandler = (err, req, res, next) => {
    console.log(err)
    // DUPLICATE ERROR
    if (err.code === 11000) {
        const error = handleDuplicateError(err)
        res.status(error.statusCode).json({
            message: error.message
        })
    }
    else if (err.name === "ValidationError") {
        const error = handleValidationError(err)
        res.status(error.statusCode).json({
            message: error.message
        })
    }
    else if (err.name === "CastError") {
        const error = handleCastError(err)
        res.status(error.statusCode).json({
            status: "error",
            message: error.message
        })
    }
    else {
        res.status(500).json({ message: "Something went wrong" })
    }
}

module.exports = errorHandler