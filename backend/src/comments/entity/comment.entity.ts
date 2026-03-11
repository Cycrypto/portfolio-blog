import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Post} from "../../posts/entity/post.entity";

@Entity('comments')
export class Comment{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    postId: number;

    @ManyToOne(() => Post, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'postId'})
    post: Post;

    @Column({type: 'text'})
    content: string;

    @Column()
    authorName: string;

    @Column({ select: false })
    authorEmail: string;

    @Column({ type: 'uuid', nullable: true })
    parentId?: string;

    @ManyToOne(() => Comment, (comment) => comment.replies, {nullable: true})
    @JoinColumn({name: 'parent_id'})
    parent?: Comment;

    @OneToMany(() => Comment, (comment) => comment.parent)
    replies: Comment[];

    @Column({default: false})
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
