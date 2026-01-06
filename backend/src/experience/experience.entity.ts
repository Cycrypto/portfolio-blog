import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  company: string;

  @Column()
  startDate: string; // ISO string or YYYY-MM

  @Column({ nullable: true })
  endDate?: string; // nullable for current

  @Column({ type: 'text', nullable: true })
  description?: string;
}
