import { Client, GatewayIntentBits } from 'discord.js';
import Ready from '../events/ready';
import MessageCreate from '../events/message-create';
import AIClient from './ai-client';

export default class DiscordClient {
  ready: boolean;
  discordClient: Client;
  login: string;
  aiClient: AIClient = new AIClient();

  constructor(login: string) {
    this.ready = false;
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
      ]
    });
    this.login = login;
  }

  async init() {
    await this.loadEvents();
    this.loginDiscord();
    this.ready = true;
    return true;
  }

  async loadEvents() {
    this.discordClient.once('ready', () => {
      const eventHandler = new Ready(this.discordClient, this.aiClient);
      eventHandler.handler();
    });

    this.discordClient.on('messageCreate', (event) => {
      const eventHandler = new MessageCreate(this.discordClient, this.aiClient);
      eventHandler.handler(event);
    });

    return true;
  }

  loginDiscord() {
    this.discordClient.login(this.login);
  }
}
