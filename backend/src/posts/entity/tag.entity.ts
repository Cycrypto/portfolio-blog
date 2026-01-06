import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Post } from './post.entity';

@Entity('tags')
export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ default: 0 })
    usageCount: number;

    @ManyToMany(() => Post, post => post.tags)
    @JoinTable({
        name: 'post_tags',
        joinColumn: {
            name: 'tag_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'post_id',
            referencedColumnName: 'id',
        },
    })
    posts: Post[];
} 