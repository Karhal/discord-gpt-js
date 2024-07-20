import { Events } from 'discord.js';
import aiCompletionHandler from '../handlers/AiCompletionHandler.js';
import { setCurrentMessage, setCompletionHandler } from '../tools.js';
import config from '../config.json' assert { type: 'json' };
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const botName = config.botName;
const maxHistory = config.maxHistory;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	name: Events.MessageCreate,
	once: false,
	execute(message) {

        let discussion = [];
        let finalResponse = "";
        let hasImage = false;
        let imagePath = "";

        if (!message.content.toLowerCase().includes(botName.toLowerCase()) || message.author.bot) return;

        message.channel.sendTyping();
        message.channel.messages.fetch({ limit: maxHistory }).then(messages => {
            messages = messages.reverse();
            messages.forEach(msg => {
                if(msg.content !== '') {
                    discussion.push(msg.author.username + ": " + msg.content);
                }
            });
            aiCompletionHandler.conversation = discussion;
        }).then(() => {

            console.log('Building summary...');
            return aiCompletionHandler.generateSummary(discussion);

        }).then(() => {

            console.log('Getting completion...');
            message.channel.sendTyping();

            setCurrentMessage(message);
            setCompletionHandler(aiCompletionHandler);
            
            return aiCompletionHandler.getAiCompletion();

        }).then((completion) => {

            const urlRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
            const imageUrl = completion.match(urlRegex)?.find(url => url.includes('oaidalleapiprodscus'));
            finalResponse = completion;

            if(imageUrl) {
                console.log('Image detected...');
                hasImage = true;
                finalResponse = finalResponse.replace(imageUrl, '');
                finalResponse = finalResponse.replace(/!\[.*\]\(\)/, '');

                message.channel.sendTyping();

                return axios.get(imageUrl, { responseType: 'arraybuffer' })
            }
            return;

        }).then(response => {
            
            if(!hasImage) {
                return;
            }

            console.log('Getting image...');
            const timestamp = new Date().getTime();
            const imageName = timestamp+'.jpg';
            const imageData = Buffer.from(response.data, 'binary');
            imagePath = path.join(__dirname, './../tmp', imageName);
            console.log('Saving image to ' + imagePath);

            return fs.writeFileSync(imagePath, imageData);

        }).then(() => {

            message.channel.send(finalResponse);
        }).finally(() => {

            if(hasImage) {
                message.channel.send({ files: [imagePath] }).then(() => {
                    console.log('Image sent');
                    if (fs.existsSync(imagePath)) {
                        fs.unlink(imagePath, (err) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Image deleted:', imagePath);
                            }
                        });
                    }
                });
            }
            console.log('Done.');
        });
	},
};