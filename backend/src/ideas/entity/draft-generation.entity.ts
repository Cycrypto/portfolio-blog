import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IdeaCandidate } from './idea-candidate.entity';
import { AssistantSession } from './assistant-session.entity';

@Entity('draft_generations')
export class DraftGeneration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  ideaCandidateId: number;

  @ManyToOne(() => IdeaCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ideaCandidateId' })
  ideaCandidate: IdeaCandidate;

  @Column({ type: 'integer', nullable: true })
  assistantSessionId: number | null;

  @ManyToOne(() => AssistantSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assistantSessionId' })
  assistantSession?: AssistantSession | null;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'text' })
  markdown: string;

  @Column({ type: 'integer', nullable: true })
  createdPostId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
