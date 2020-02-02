import { AbstractScript } from '../core/script';
import { Arguments, ArgumentsParser, CommandBuilder } from '../core/utils/cli';

export class InstallScript extends AbstractScript {
  public execute(args: Arguments, env: string) {
    const parsedArgs = ArgumentsParser.parse(
      CommandBuilder.create()
        .setDescription('Install a module')
        .addArgument('moduleName', {
          describe: 'The module to install',
          type: 'string',
        }),
      args,
    );
    this.getKernel().install(parsedArgs.get('moduleName'), parsedArgs, env);
  }
}
