import {HttpException, HttpStatus} from "@nestjs/common";

export class BaseException extends HttpException{
    constructor(message: string, status: HttpStatus, code: string) {
        super({success: false, code, message}, status);
    }
}