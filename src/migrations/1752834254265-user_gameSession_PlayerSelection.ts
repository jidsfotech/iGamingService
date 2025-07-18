import { MigrationInterface, QueryRunner } from "typeorm";

export class UserGameSessionPlayerSelection1752834254265 implements MigrationInterface {
    name = 'UserGameSessionPlayerSelection1752834254265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`game_session\` (\`id\` varchar(36) NOT NULL, \`startTime\` datetime NOT NULL, \`endTime\` datetime NOT NULL, \`winningNumber\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`player_selection\` (\`id\` varchar(36) NOT NULL, \`selectedNumber\` int NULL, \`userId\` varchar(36) NULL, \`gameSessionId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(255) NOT NULL, \`wins\` int NOT NULL DEFAULT '0', \`looses\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`player_selection\` ADD CONSTRAINT \`FK_966f830a23b4ae70d9df1300375\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`player_selection\` ADD CONSTRAINT \`FK_020fcfb972d3c85b3865155b453\` FOREIGN KEY (\`gameSessionId\`) REFERENCES \`game_session\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player_selection\` DROP FOREIGN KEY \`FK_020fcfb972d3c85b3865155b453\``);
        await queryRunner.query(`ALTER TABLE \`player_selection\` DROP FOREIGN KEY \`FK_966f830a23b4ae70d9df1300375\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`player_selection\``);
        await queryRunner.query(`DROP TABLE \`game_session\``);
    }

}
