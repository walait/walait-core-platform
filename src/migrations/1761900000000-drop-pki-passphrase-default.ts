import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPkiPassphraseDefault1761900000000 implements MigrationInterface {
  name = "DropPkiPassphraseDefault1761900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "public_key_infrastructure" ALTER COLUMN "passphrase" DROP DEFAULT',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public_key_infrastructure" ALTER COLUMN "passphrase" SET DEFAULT 'fVoRFWaH/0WwqT0U6XfD8faFQb67dvcphF4KQBMXU+g08SY8ceuc8+5Uc5wAOJ+zfh3RSCntlBVwDtLGw/SIafW5pjLEeVTgqhkNug=='`,
    );
  }
}
