import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const statusCode = exception.getStatus()
    const errorResponse: any = exception.getResponse()
    const message =
      typeof errorResponse === 'object'
        ? typeof errorResponse.message === 'object'
          ? errorResponse.message[0]
          : errorResponse.message
        : exception.message

    console.log('HttpExceptionFilter', exception)
    console.log('HttpExceptionFilter', errorResponse)
    console.log('HttpExceptionFilter', statusCode)

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      message
    })
  }
}
