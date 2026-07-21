import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1721000000000 implements MigrationInterface {
  name = 'InitSchema1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"        UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name"      VARCHAR     NOT NULL,
        "email"     VARCHAR     NOT NULL,
        "password"  VARCHAR     NOT NULL,
        "createdAt" TIMESTAMP   NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email"  UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "investments" (
        "id"             UUID           NOT NULL DEFAULT gen_random_uuid(),
        "userId"         UUID           NOT NULL,
        "investmentName" VARCHAR        NOT NULL,
        "investmentType" VARCHAR        NOT NULL,
        "investedAmount" NUMERIC(14,2)  NOT NULL,
        "currentValue"   NUMERIC(14,2)  NOT NULL,
        "purchaseDate"   DATE           NOT NULL,
        "createdAt"      TIMESTAMP      NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP      NOT NULL DEFAULT now(),
        CONSTRAINT "PK_investments"         PRIMARY KEY ("id"),
        CONSTRAINT "FK_investments_userId"
          FOREIGN KEY ("userId")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_investments_userId" ON "investments" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_investments_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "investments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
