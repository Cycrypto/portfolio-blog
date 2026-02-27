import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {TagsService} from "../service/tags.service";
import {Tag} from "../entity/tag.entity";

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Get('top')
    async getTopTags(@Query('limit') limit: string = '5'): Promise<Tag[]> {
        const limitNum = parseInt(limit);
        if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            throw new BadRequestException('limit은 1~100 범위의 숫자여야 합니다.');
        }
        return this.tagsService.getTopTags(limitNum);
    }
} 
