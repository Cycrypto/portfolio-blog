import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post, PostContentType, PostStatus } from '../entity/post.entity';
import { Repository } from 'typeorm';
import { CreatePostRequestDTO } from '../dto/request/create-post-request.dto';
import { UpdatePostRequestDTO } from '../dto/request/update-post-request.dto';
import { PostListItemDTO } from '../dto/response/post-list-item.dto';
import { TagsService } from './tags.service';
import { JSONContent } from '@tiptap/core';
import { RenderedContent, renderMarkdownContent, renderTiptapContent } from '../utils/content-renderer';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private postRepository: Repository<Post>,
        private tagsService: TagsService,
    ) {}

    async getPosts(
        keyword: string = '',
        tag: string = '',
        page: number = 1,
        pageSize: number = 10): Promise<PostListItemDTO[]> {

        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.tags', 'tags')
            .where('post.status = :status', { status: PostStatus.PUBLISHED });

        if (keyword) {
            queryBuilder.andWhere(
                '(post.title LIKE :keyword OR post.plainText LIKE :keyword OR post.contentMarkdown LIKE :keyword OR post.excerpt LIKE :keyword)',
                { keyword: `%${keyword}%` }
            );
        }

        if (tag) {
            queryBuilder.andWhere('tags.name = :tagName', { tagName: tag });
        }

        queryBuilder.skip((page - 1) * pageSize).take(pageSize);
        const posts = await queryBuilder.getMany();

        return posts.map(post => ({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            contentType: post.contentType,
            image: post.image,
            tags: post.tags ? post.tags.map(tag => tag.name) : [],
            status: post.status,
            author: post.author,
            category: post.category,
            publishDate: post.publishDate,
            views: post.views,
            comments: post.comments,
            readTime: post.readTime
        }));
    }

    async getPostsCount(keyword: string = '', tag: string = ''): Promise<number> {
        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.tags', 'tags')
            .where('post.status = :status', { status: PostStatus.PUBLISHED });

        if (keyword) {
            queryBuilder.andWhere(
                '(post.title LIKE :keyword OR post.plainText LIKE :keyword OR post.contentMarkdown LIKE :keyword OR post.excerpt LIKE :keyword)',
                { keyword: `%${keyword}%` }
            );
        }

        if (tag) {
            queryBuilder.andWhere('tags.name = :tagName', { tagName: tag });
        }

        return queryBuilder.getCount();
    }

    async createPost(createPostDTO: CreatePostRequestDTO): Promise<Post> {
        if (createPostDTO.contentType !== PostContentType.TIPTAP) {
            throw new BadRequestException('Only tiptap contentType is allowed for new posts');
        }

        let tags: any[] = [];
        if (createPostDTO.tags && createPostDTO.tags.length > 0) {
            tags = await this.tagsService.findOrCreateTags(createPostDTO.tags);
        }

        const renderedContent = this.renderContentOrThrow(
            createPostDTO.contentType,
            createPostDTO.contentJson,
            createPostDTO.contentMarkdown
        );

        const postData = {
            ...createPostDTO,
            status: createPostDTO.status as PostStatus,
            tags: tags,
            contentJson: createPostDTO.contentJson as JSONContent,
            contentMarkdown: null,
            contentHtml: renderedContent.html,
            plainText: renderedContent.plainText,
            headings: renderedContent.headings,
            wordCount: renderedContent.wordCount,
            readTime: createPostDTO.readTime ?? renderedContent.readTime,
        };
        const post = this.postRepository.create(postData);
        return this.postRepository.save(post);
    }

    async updatePost(id: number, updatePostDTO: UpdatePostRequestDTO): Promise<Post | null> {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['tags']
        });

        if (!post) {
            console.log('Post not found');
            return null;
        }

        console.log('Original post:', post);

        if (post.tags && post.tags.length > 0) {
            await this.tagsService.updateTagUsage(post.tags.map(tag => tag.name));
        }

        let tags: any[] = [];
        if (updatePostDTO.tags) {
            tags = updatePostDTO.tags.length > 0
                ? await this.tagsService.findOrCreateTags(updatePostDTO.tags)
                : [];
        }

        const { tags: _, ...updateData } = updatePostDTO;

        if (updateData.status) {
            updateData.status = updateData.status as PostStatus;
        }

        const shouldUpdateContent =
            updatePostDTO.contentType !== undefined ||
            updatePostDTO.contentJson !== undefined ||
            updatePostDTO.contentMarkdown !== undefined;

        let renderedContent: RenderedContent | null = null;
        let contentType = post.contentType;
        let contentJson = post.contentJson;
        let contentMarkdown = post.contentMarkdown;

        if (shouldUpdateContent) {
            contentType = updatePostDTO.contentType ?? post.contentType;
            contentJson = updatePostDTO.contentJson ?? post.contentJson;
            contentMarkdown = updatePostDTO.contentMarkdown ?? post.contentMarkdown;

            renderedContent = this.renderContentOrThrow(
                contentType,
                contentJson,
                contentMarkdown
            );
        }

        const mergedPost = this.postRepository.merge(post, updateData);

        if (shouldUpdateContent && renderedContent) {
            mergedPost.contentType = contentType;
            mergedPost.contentJson = contentType === PostContentType.TIPTAP
                ? (contentJson as JSONContent)
                : null;
            mergedPost.contentMarkdown = contentType === PostContentType.MARKDOWN
                ? contentMarkdown
                : null;
            mergedPost.contentHtml = renderedContent.html;
            mergedPost.plainText = renderedContent.plainText;
            mergedPost.headings = renderedContent.headings;
            mergedPost.wordCount = renderedContent.wordCount;
            mergedPost.readTime = updatePostDTO.readTime ?? renderedContent.readTime;
        }

        if (updatePostDTO.tags) {
            mergedPost.tags = tags;
        }

        await this.postRepository.save(mergedPost);

        return this.postRepository.findOne({
            where: { id },
            relations: ['tags']
        });
    }

    async deletePost(id: number): Promise<boolean> {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['tags'],
        });
        if (!post) {
            return false;
        }

        if (post.tags && post.tags.length > 0) {
            await this.tagsService.handleTagCleanupForDeletedPost(post.tags);
        }

        await this.postRepository.remove(post);
        return true;
    }

    async getPostById(id: number): Promise<Post | null> {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['tags']
        });

        if (!post) {
            return null;
        }

        if (!post.contentHtml || !post.plainText || !post.headings || !post.wordCount) {
            try {
                const renderedContent = this.renderContentOrThrow(
                    post.contentType,
                    post.contentJson,
                    post.contentMarkdown
                );
                post.contentHtml = renderedContent.html;
                post.plainText = renderedContent.plainText;
                post.headings = renderedContent.headings;
                post.wordCount = renderedContent.wordCount;
                post.readTime = post.readTime ?? renderedContent.readTime;
                await this.postRepository.save(post);
            } catch (error) {
                console.error('Failed to backfill content cache:', error);
                post.contentHtml = post.contentHtml ?? '<p class="text-red-500">콘텐츠를 불러올 수 없습니다.</p>';
                post.headings = post.headings ?? [];
                post.plainText = post.plainText ?? '';
                post.wordCount = post.wordCount ?? 0;
            }
        }

        return post;
    }

    private renderContentOrThrow(
        contentType: PostContentType,
        contentJson?: Record<string, unknown> | null,
        contentMarkdown?: string | null
    ): RenderedContent {
        if (contentType === PostContentType.TIPTAP) {
            if (!contentJson) {
                throw new BadRequestException('contentJson is required for tiptap content');
            }
            return renderTiptapContent(contentJson as JSONContent);
        }

        if (!contentMarkdown) {
            throw new BadRequestException('contentMarkdown is required for markdown content');
        }

        return renderMarkdownContent(contentMarkdown);
    }
}
