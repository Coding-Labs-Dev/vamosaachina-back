import path from 'path';
import dotenv from 'dotenv';
import YAML from 'yamljs';

const env = process.env.NODE_ENV;

if (['dev'].includes(env)) {
  const config = YAML.load(path.join(__dirname, '.env.yml'));
  Object.assign(process.env, config[env]);
} else {
  dotenv.config();
}
