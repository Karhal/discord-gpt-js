import { Client } from 'discord.js';
import { AIClientType } from '../types/AIClientType';
import AiCompletionHandler from '../handlers/ai-completion-handler';
import ConfigManager, { ConfigType } from '../configManager';

interface EventDiscordType {
  eventName: string;
  aiClient: AIClientType;
  once: boolean;
  handler: Function;
  discordClient: Client;
  init: () => void;
  initOnEvent: () => void;
  initOnceEvent: () => void;
}

export default abstract class EventDiscord implements EventDiscordType {
  aiCompletionHandler: AiCompletionHandler;
  constructor(
    public discordClient: Client,
    public aiClient: AIClientType,
    public once: boolean = false,
    public eventName: string = 'eventName',
    public handler: Function = function() {},
    public config: ConfigType = ConfigManager.config
  ) {
    this.aiCompletionHandler = new AiCompletionHandler(this.aiClient, ConfigManager.config.AIPrompt);
  }

  init() {
    this.once ? this.initOnceEvent() : this.initOnEvent();
    console.log(this.eventName + ' added');
  }

  initOnEvent() {
    this.discordClient.on(this.eventName, this.handler.bind(this));
  }

  initOnceEvent() {
    this.discordClient.once(this.eventName, this.handler.bind(this));
  }
}
