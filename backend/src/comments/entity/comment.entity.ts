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

    @Column()
    postId: string;

    @ManyToOne(() => Post, (post) => post.comments, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'post_id'})
    post: Post;

    @Column({type: 'text'})
    content: string;

    @Column()
    authorName: string;

    @Column()
    authorEmail: string;

    @Column({nullable: true})
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
