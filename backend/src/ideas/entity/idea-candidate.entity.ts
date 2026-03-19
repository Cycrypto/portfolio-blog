import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IdeaImport } from './idea-import.entity';
import { IdeaGeneratorMode } from './idea-import.enums';
import { Post } from '../../posts/entity/post.entity';

export enum IdeaCandidateStatus {
  OPEN = 'open',
  USED = 'used',
}

@Entity('idea_candidates')
export class IdeaCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  importId: number;

  @ManyToOne(() => IdeaImport, (ideaImport) => ideaImport.candidates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'importId' })
  ideaImport: IdeaImport;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('text', { array: true, default: '{}' })
  keywords: string[];

  @Column({ type: 'text' })
  evidenceSnippet: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ default: IdeaGeneratorMode.FALLBACK })
  generator: IdeaGeneratorMode;

  @Column({ type: 'text', nullable: true })
  continuationBrief: string | null;

  @Column('int', { array: true, default: '{}' })
  sourceMessageRefs: number[];

  @Column({ default: IdeaCandidateStatus.OPEN })
  status: IdeaCandidateStatus;

  @Column({ type: 'integer', nullable: true })
  usedPostId: number | null;

  @ManyToOne(() => Post, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usedPostId' })
  usedPost?: Post | null;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
