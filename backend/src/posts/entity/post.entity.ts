import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { IsEnum } from 'class-validator';
import { Tag } from './tag.entity';

// 상태를 enum으로 정의
export enum PostStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
}

export enum PostContentType {
    MARKDOWN = 'markdown',
    TIPTAP = 'tiptap',
}

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ unique: true, nullable: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    excerpt: string;

    @Column({
        name: 'content',
        type: 'text',
        nullable: true,
    })
    contentMarkdown: string | null;

    @Column({
        type: 'enum',
        enum: PostContentType,
        default: PostContentType.MARKDOWN,
    })
    contentType: PostContentType;

    @Column({ type: 'jsonb', nullable: true })
    contentJson: Record<string, unknown> | null;

    @Column({ type: 'text', nullable: true })
    contentHtml: string | null;

    @Column({ type: 'text', nullable: true })
    plainText: string | null;

    @Column({ type: 'jsonb', nullable: true })
    headings: Array<{ level: number; text: string; id: string }> | null;

    @Column({ type: 'integer', nullable: true })
    wordCount: number | null;

    @Column({ nullable: true })
    image: string;

    @ManyToMany(() => Tag, tag => tag.posts)
    @JoinTable({
        name: 'post_tags',
        joinColumn: {
            name: 'post_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'tag_id',
            referencedColumnName: 'id',
        },
    })
    tags: Tag[];

    // status를 enum으로 수정
    @Column({ nullable: true })
    @IsEnum(PostStatus)  // enum으로 타입 체크
    status: PostStatus;

    @Column()
    author: string;

    @Column()
    category: string;

    @Column()
    publishDate: string;

    @Column({ default: 0 })
    views: number;

    @Column({ default: 0 })
    comments: number;

    @Column({ default: 8 })
    readTime: number; // 읽는 시간 (분)
}
