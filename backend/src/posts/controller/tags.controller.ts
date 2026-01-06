import { Controller, Get, Query } from "@nestjs/common";
import {TagsService} from "../service/tags.service";
import {Tag} from "../entity/tag.entity";

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Get('top')
    async getTopTags(@Query('limit') limit: string = '5'): Promise<Tag[]> {
        const limitNum = parseInt(limit);
        return this.tagsService.getTopTags(limitNum);
    }
} 