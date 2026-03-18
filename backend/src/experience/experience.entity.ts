import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ExperienceType } from './experience.constants';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'career' })
  type: ExperienceType;

  @Column()
  title: string;

  @Column()
  organization: string;

  @Column()
  startDate: string; // ISO string or YYYY-MM

  @Column({ type: 'character varying', nullable: true })
  endDate?: string | null; // nullable for current

  @Column({ type: 'text', nullable: true })
  description?: string | null;
}
