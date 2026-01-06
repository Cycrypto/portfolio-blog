import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                // @ts-ignore
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let responseMessage: any;

        if (exception instanceof ForbiddenException) {
            responseMessage = '접근 권한이 없습니다.';
        } else if (exception instanceof HttpException) {
            const errorResponse = exception.getResponse();
            if (typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse) {
                responseMessage = (errorResponse as any).message;
            } else {
                responseMessage = errorResponse;
            }
        } else {
            responseMessage = '서버 내부 오류가 발생했습니다.';
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: responseMessage,
        });
    }
}
