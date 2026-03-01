import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MonthlyLimits } from "../entities/monthly-limits.entity";

@Injectable()
export class LimitsService {
  constructor(
    @InjectRepository(MonthlyLimits)
    private readonly limitsRepository: Repository<MonthlyLimits>,
  ) {}

  getCurrentPeriod(date: Date = new Date()): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return year * 100 + month;
  }

  async getOrCreate(playerId: string, yyyymm: number): Promise<MonthlyLimits> {
    const existing = await this.limitsRepository.findOne({
      where: { player_id: playerId, yyyymm },
    });

    if (existing) {
      return existing;
    }

    const created = this.limitsRepository.create({
      player_id: playerId,
      yyyymm,
      sent_count: 0,
      accepted_count: 0,
    });

    return this.limitsRepository.save(created);
  }

  async canSendChallenge(playerId: string, yyyymm: number): Promise<boolean> {
    await this.getOrCreate(playerId, yyyymm);
    return true;
  }

  async canAcceptChallenge(playerId: string, yyyymm: number): Promise<boolean> {
    await this.getOrCreate(playerId, yyyymm);
    return true;
  }

  async incrementSent(playerId: string, yyyymm: number): Promise<void> {
    const limits = await this.getOrCreate(playerId, yyyymm);
    limits.sent_count += 1;
    await this.limitsRepository.save(limits);
  }

  async incrementAccepted(playerId: string, yyyymm: number): Promise<void> {
    const limits = await this.getOrCreate(playerId, yyyymm);
    limits.accepted_count += 1;
    await this.limitsRepository.save(limits);
  }
}
