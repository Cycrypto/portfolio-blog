import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
        const normalizedTagNames = Array.from(
            new Set(tagNames.map((tagName) => tagName.trim()).filter((tagName) => tagName.length > 0)),
        );

        if (normalizedTagNames.length === 0) {
            return [];
        }

        const existingTags = await this.tagRepository.find({
            where: { name: In(normalizedTagNames) }
        });
        const existingTagMap = new Map(existingTags.map((tag) => [tag.name, tag]));

        const tagsToSave = normalizedTagNames.map((tagName) => {
            const existingTag = existingTagMap.get(tagName);
            if (existingTag) {
                existingTag.usageCount += 1;
                return existingTag;
            }

            return this.tagRepository.create({ name: tagName, usageCount: 1 });
        });

        return this.tagRepository.save(tagsToSave);
    }

    async updateTagUsage(tagNames: string[]): Promise<void> {
        const normalizedTagNames = Array.from(
            new Set(tagNames.map((tagName) => tagName.trim()).filter((tagName) => tagName.length > 0)),
        );
        if (normalizedTagNames.length === 0) {
            return;
        }

        const tags = await this.tagRepository.find({
            where: { name: In(normalizedTagNames) }
        });

        const tagsToRemove: Tag[] = [];
        const tagsToSave: Tag[] = [];

        for (const tag of tags) {
            tag.usageCount -= 1;
            if (tag.usageCount <= 0) {
                tagsToRemove.push(tag);
            } else {
                tagsToSave.push(tag);
            }
        }

        if (tagsToSave.length > 0) {
            await this.tagRepository.save(tagsToSave);
        }

        if (tagsToRemove.length > 0) {
            await this.tagRepository.remove(tagsToRemove);
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
