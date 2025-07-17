import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
dotenv.config();

const {
  NODE_ENV,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;
const options: DataSourceOptions = {
  type: 'mysql',
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  synchronize: false,
  logging: NODE_ENV !== 'production' ? ['query'] : false,
  entities: [__dirname + '/entity/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  subscribers: [],
  extra: {
    connectionLimit: 10,
  },
};

export const AppDataSource = new DataSource(options);
