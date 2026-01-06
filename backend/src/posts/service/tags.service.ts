import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entity/tag.entity';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private tagRepository: Repository<Tag>,
    ) {}

    async getTopTags(limit: number = 5): Promise<Tag[]> {
        return this.tagRepository
            .createQueryBuilder('tag')
            .where('tag.usageCount > 0')
            .orderBy('tag.usageCount', 'DESC')
            .take(limit)
            .getMany();
    }

    async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
        const tags: Tag[] = [];
        
        for (const tagName of tagNames) {
            let tag = await this.tagRepository.findOne({
                where: { name: tagName }
            });
            
            if (!tag) {
                tag = this.tagRepository.create({ name: tagName, usageCount: 1 });
            } else {
                tag.usageCount += 1;
            }
            
            await this.tagRepository.save(tag);
            tags.push(tag);
        }
        
        return tags;
    }

    async updateTagUsage(tagNames: string[]): Promise<void> {
        for (const tagName of tagNames) {
            const tag = await this.tagRepository.findOne({
                where: { name: tagName }
            });

            if (tag) {
                tag.usageCount -= 1;
                if (tag.usageCount <= 0) {
                    await this.tagRepository.remove(tag);
                } else {
                    await this.tagRepository.save(tag);
                }
            }
        }
    }

    async handleTagCleanupForDeletedPost(tags: Tag[]): Promise<void> {
        for (const tag of tags) {
            if (tag.usageCount <= 1) {
                await this.tagRepository.remove(tag);
            } else {
                tag.usageCount -= 1;
                await this.tagRepository.save(tag);
            }
        }
    }
} 