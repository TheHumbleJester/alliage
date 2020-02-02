import path from 'path';

import { Kernel, ModuleMap } from '../kernel';
import { Arguments } from '../utils/cli';

const LOCAL_MODULE_PATTERN = /^\.{0,2}\//;

export interface ModulesDefinition {
  [key: string]: {
    module: string;
    deps: string[];
  };
}

export abstract class AbstractScript {
  private kernel: Kernel;

  public constructor() {
    this.kernel = this.loadKernel();
  }

  /* eslint-disable import/no-dynamic-require, global-require */
  private loadKernel() {
    const modulesDefinition: ModulesDefinition = require(path.resolve('./alliage-modules.json'));

    const modules: ModuleMap = Object.entries(modulesDefinition).reduce(
      (acc, [name, def]) => ({
        ...acc,
        [name]: [
          def.module.match(LOCAL_MODULE_PATTERN)
            ? require(path.resolve(def.module))
            : require(def.module),
          def.deps,
        ],
      }),
      {},
    );
    return new Kernel(modules);
  }
  /* eslint-disable import/no-dynamic-require, global-require */

  protected getKernel() {
    return this.kernel;
  }

  public abstract execute(args?: Arguments, env?: string): void;
}

export interface ScriptConstructor {
  new (): AbstractScript;
}
