import { ModuleConstructor } from '../module';
import { PrimitiveContainer } from '../primitive-container';
import { Arguments } from '../utils/cli';

export enum INITIALIZATION_CONTEXT {
  INSTALL = 'INSTALL',
  BUILD = 'BUILD',
  RUN = 'RUN',
}

type InitKernelEventHandler = (
  args: Arguments,
  env: string,
  container: PrimitiveContainer,
  context: INITIALIZATION_CONTEXT,
) => Promise<void>;
type RegularKernelEventHandler = (
  args: Arguments,
  env: string,
  container: PrimitiveContainer,
) => Promise<void>;
type KernelEventHandler = InitKernelEventHandler | RegularKernelEventHandler;

export interface KernelEventHandlers {
  init?: InitKernelEventHandler;
  install?: RegularKernelEventHandler;
  build?: RegularKernelEventHandler;
  run?: RegularKernelEventHandler;
}

export type ModuleEventHandlers = {
  [key in keyof KernelEventHandlers]-?: KernelEventHandler[];
};

export type KernelEvent = keyof KernelEventHandlers;

export interface ModuleMap {
  [moduleName: string]: [ModuleConstructor, string[]];
}

enum MODULE_STATE {
  LOADING = 'loading',
  LOADED = 'loaded',
}

export class CircularReferenceError extends Error {}

const EVENT_INITIALIZATION_CONTEXTS = {
  init: (null as unknown) as INITIALIZATION_CONTEXT,
  install: INITIALIZATION_CONTEXT.INSTALL,
  build: INITIALIZATION_CONTEXT.BUILD,
  run: INITIALIZATION_CONTEXT.RUN,
};

export class Kernel {
  private modules: ModuleMap;

  private container: PrimitiveContainer;

  public constructor(modules: ModuleMap) {
    this.modules = modules;
    this.container = new PrimitiveContainer();
  }

  /* eslint-disable no-param-reassign, no-await-in-loop */
  private loadModules(
    events: Set<KernelEvent>,
    modulesToLoad: string[],
    eventHandlers: ModuleEventHandlers = { init: [], install: [], build: [], run: [] },
    modulesStates: { [name: string]: MODULE_STATE | undefined } = {},
  ): ModuleEventHandlers {
    for (const moduleName of modulesToLoad) {
      const loadingState = modulesStates[moduleName];
      if (loadingState !== MODULE_STATE.LOADED) {
        if (loadingState === MODULE_STATE.LOADING) {
          throw new CircularReferenceError(`Circular reference on ${moduleName}`);
        }
        modulesStates[moduleName] = MODULE_STATE.LOADING;
        const currentModule = this.modules[moduleName];
        if (currentModule[1].length > 0) {
          this.loadModules(events, currentModule[1], eventHandlers, modulesStates);
        }
        const moduleInstance = new currentModule[0]();
        const moduleEventHandlers = moduleInstance.getKernelEventHandlers();
        events.forEach((event) => {
          const eventHandler = moduleEventHandlers[event];
          if (eventHandler) {
            eventHandlers[event].push(eventHandler);
          }
        });
        modulesStates[moduleName] = MODULE_STATE.LOADED;
      }
    }
    return eventHandlers;
  }
  /* eslint-enable no-param-reassign, no-await-in-loop */

  public async install(moduleName: string, args: Arguments, env: string) {
    await this.triggerEvent('install', args, env, [moduleName]);
  }

  public async build(args: Arguments, env: string) {
    await this.triggerEvent('build', args, env);
  }

  public async run(args: Arguments, env: string) {
    await this.triggerEvent('run', args, env);
  }

  /* eslint-disable no-await-in-loop */
  private async triggerEvent(
    eventName: KernelEvent,
    args: Arguments,
    env: string,
    modulesToLoad: string[] = Object.keys(this.modules),
  ) {
    const eventHandlers = this.loadModules(
      new Set<KernelEvent>(['init', eventName]),
      modulesToLoad,
    );
    for (const initHandler of eventHandlers.init) {
      await initHandler(args, env, this.container, EVENT_INITIALIZATION_CONTEXTS[eventName]);
    }
    this.container.freeze();
    for (const eventHandler of eventHandlers[eventName]) {
      await eventHandler(args, env, this.container, undefined as any);
    }
  }
  /* eslint-enable no-await-in-loop */
}
