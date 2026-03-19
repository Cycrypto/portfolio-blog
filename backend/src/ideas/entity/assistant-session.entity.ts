import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IdeaCandidate } from './idea-candidate.entity';

export enum AssistantSessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

@Entity('assistant_sessions')
export class AssistantSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  ideaCandidateId: number;

  @ManyToOne(() => IdeaCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ideaCandidateId' })
  ideaCandidate: IdeaCandidate;

  @Column()
  workerSessionId: string;

  @Column({ default: AssistantSessionStatus.ACTIVE })
  status: AssistantSessionStatus;

  @Column({ type: 'text', default: '' })
  sessionSummary: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
