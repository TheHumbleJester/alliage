import { InstallScript } from '../install';
import { Arguments } from '../../core/utils/cli';

jest.mock('../../core/script');

const commandBuilderMock = {
  setDescription: jest.fn().mockReturnThis(),
  addArgument: jest.fn().mockReturnThis(),
};
const commandBuilderCreateMock = jest.fn().mockReturnValue(commandBuilderMock);
const argumentsParserMock = jest.fn();

jest.mock('../../core/utils/cli', () => {
  return {
    ...jest.requireActual('../../core/utils/cli'),
    CommandBuilder: {
      create: () => commandBuilderCreateMock(),
    },
    ArgumentsParser: {
      parse: (...args: any[]) => argumentsParserMock(...args),
    },
  };
});

describe('core/script/run', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('InstallScript', () => {
    describe('#execute', () => {
      it("should call the 'install' method of the kernel", () => {
        const args = Arguments.create();
        const installScript = new InstallScript() as any;

        const parsedArguments = Arguments.create({ moduleName: 'test_module_name' });
        argumentsParserMock.mockReturnValue(parsedArguments);

        installScript.execute(args, 'test');

        expect(argumentsParserMock).toHaveBeenCalledWith(commandBuilderMock, args);

        expect(commandBuilderMock.setDescription).toHaveBeenCalledWith('Install a module');
        expect(commandBuilderMock.addArgument).toHaveBeenCalledWith('moduleName', {
          describe: 'The module to install',
          type: 'string',
        });

        expect(installScript.kernel.run).not.toHaveBeenCalled();
        expect(installScript.kernel.install).toHaveBeenCalledWith(
          'test_module_name',
          parsedArguments,
          'test',
        );
        expect(installScript.kernel.build).not.toHaveBeenCalled();
      });
    });
  });
});
