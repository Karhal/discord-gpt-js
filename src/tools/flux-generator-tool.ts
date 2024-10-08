import ImageHandler from '../handlers/image-handler';
import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';
import * as fal from '@fal-ai/serverless-client';
fal.config({
  credentials: ConfigManager.config.fluxApi.apiKey
});
export default class FluxGeneratorTool extends AbstractTool {
  readonly toolName = 'flux';
  public isActivated = ConfigManager.config.fluxApi.active;

  readonly description =
    'Use this tool only when the user asks you to draw or to show a picture of something in the last message. \
    The tool will generate an image based on the prompt you provide and add it as an attachment on discord.';

  readonly parameters = {
    type: 'object',
    properties: {
      imagePrompt: {
        type: 'string',
        description:
          'Prompt for the image generation. The more specific your prompt, the better the image quality. \
            Include details like the setting, objects, colors, mood, and any specific elements you want in the image. \
            Consider Perspective and Composition. Specify Lighting and Time of Day. \
            Specify Desired Styles or Themes.'
      }
    }
  };

  readonly execute = async (promptAsString: string) => {
    try {
      const prompt = JSON.parse(promptAsString);

      const imageHandler = new ImageHandler();

      const result = await fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt: prompt.imagePrompt,
          enable_safety_checker: false
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        }
      });

      console.log(result);

      const imgUrls = result.images.map((element) => {
        return element.url;
      });

      await imageHandler.downloadImages(imgUrls);

      return JSON.stringify({ image_ready: true });
    }
    catch (error: unknow) {
      console.log(error);
      if (error && error.status === 400) {
        return error?.error?.message || null;
      }
    }
  };
}
