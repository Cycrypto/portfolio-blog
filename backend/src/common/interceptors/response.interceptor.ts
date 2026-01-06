import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

// Nest가 DI로 관리함
@Injectable()
// 요청 - 응답을 가로채서 응답을 변형하는 역할
export class ResponseInterceptor<T> implements NestInterceptor<T, CommonResponse<T>>{
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<CommonResponse<T>> | Promise<Observable<CommonResponse<T>>> {
        return next.handle().pipe(
            map((data) => ({
                success:true,
                timestamp: new Date().toISOString(),
                data,
            })),
        );
    }
}

interface CommonResponse<T>{
    success: boolean;
    timestamp: string;
    data: T;
}
