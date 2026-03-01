import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Match } from "../entities/match.entity";
import { ExpireScheduleJob } from "../jobs/expire-schedule.job";
import { MatchStatus } from "../tenis.enums";

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly expireScheduleJob: ExpireScheduleJob,
  ) {}

  async createMatch(challengeId: string): Promise<Match> {
    const match = this.matchRepository.create({
      challenge_id: challengeId,
      status: MatchStatus.PENDING_SCHEDULE,
      selected_schedule_option_id: null,
      scheduled_start_at: null,
      scheduled_slot: null,
      scheduled_date: null,
    });
    const saved = await this.matchRepository.save(match);
    await this.scheduleAgendaExpiration(saved.id);
    return saved;
  }

  async getMatch(matchId: string): Promise<Match | null> {
    return this.matchRepository.findOne({ where: { id: matchId } });
  }

  async getMatchByChallengeId(challengeId: string): Promise<Match | null> {
    return this.matchRepository.findOne({ where: { challenge_id: challengeId } });
  }

  async save(match: Match): Promise<Match> {
    return this.matchRepository.save(match);
  }

  async moveToPendingSchedule(matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      return;
    }

    match.status = MatchStatus.PENDING_SCHEDULE;
    await this.matchRepository.save(match);
    await this.scheduleAgendaExpiration(match.id);
  }

  private async scheduleAgendaExpiration(matchId: string): Promise<void> {
    const runAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await this.expireScheduleJob.scheduleExpire(matchId, runAt);
  }
}
