import AiCompletionHandler from '../handlers/ai-completion-handler';
import AIClient from '../clients/ai-client';
import { tools } from '../tools';
import config from '../config';
import EventDiscord from '../clients/events-discord';
import ImageHandler from '../handlers/image-handler';
import { Events, Message } from 'discord.js';

export default class MessageCreate extends EventDiscord {
  eventName = Events.MessageCreate;
  handler = async (message: Message) => {
    const maxHistory = config.discord.maxHistory;
    if (
      !this.theMessageContainsBotName(message) ||
      message.author.id === this.discordClient?.user?.id
    ) {
      return;
    }

    const channelId = message.channelId;
    const messagesChannelHistory = await message.channel.messages.fetch({
      limit: maxHistory,
    });
    message.channel.sendTyping();

    const aiCompletionHandler = new AiCompletionHandler(
      this.aiClient,
      config.openAI.prompt,
      tools,
    );
    aiCompletionHandler.setChannelHistory(channelId, messagesChannelHistory);

    const summary = await aiCompletionHandler.getSummary(channelId);
    if (summary) {
      const completion = await aiCompletionHandler.getAiCompletion(
        summary,
        channelId,
      );
      let content = completion.content;
      const imageEngine = new ImageHandler(this.aiClient, message, content);
      const findImages = await imageEngine.getImageFromMSG();
      if (findImages) {
        content = imageEngine.content;
      }

      message.channel.sendTyping();
      await this.sendResponse(message, content, imageEngine.downloadedImages);
      if (findImages) {
        imageEngine.deleteImages();
      }
    }

    console.log('Done.');
  };

  async sendResponse(message: Message, response: string, imagePaths: string[]) {
    response = response.trim().replace(/\n\s*\n/g, '\n');
    message.channel.send(response);
    if (imagePaths.length > 0) {
      message.channel.sendTyping();
      await message.channel.send({ files: imagePaths });
      console.log('Images sent');
    }
    return true;
  }

  theMessageContainsBotName(message: Message) {
    const botName = config.discord.botName;
    return message.content.toLowerCase().includes(botName.toLowerCase());
  }
}
