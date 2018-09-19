import EnvBase from 'lib/utils/env-base';
// import { getQueryString } from 'lib/uri';

export class EnvConfig extends EnvBase {
  getEnvName() {
    let env = 'prod';
    return env;
  }
  getEnvType() {
    let env = 'SIT';
    return env;
  }
  AppServices = {
    me: 'http://localhost:3006/api/',
    inte: 'http://localhost:3006/api/',
    rc: 'http://localhost:3006/api/',
    prod: 'http://localhost:3006/api/',
  };
}

export default new EnvConfig()
