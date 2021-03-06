const fs = require('fs');  //To read files
const Discord = require('discord.js');    //To access Discord API
const { prefix, token } = require('./config.json'); // storing Prefix and Token
const mongo = require('./src/connect')
const general = require('./reactions/general')
const resell = require('./reactions/resell')
const kick = require('./reactions/kick')
const paypal = require('./reactions/paypal')
const close = require('./reactions/close')
const reopen = require('./reactions/reopen')
const transcript = require('./reactions/transcript')
const ticket = require('./reactions/delete')

const client = new Discord.Client({partials: ['MESSAGE', 'CHANNEL', 'REACTION','USER','GUILD_MEMBER'] }); // Creating a new Client
client.commands = new Discord.Collection(); // Accessing commands collection

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // Reding command files

/*Storing commands in a accessible manner*/
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection(); // Cooldowns collection

/*Invokes When BOT is ready to do tasks*/ 
client.once('ready', () => {
    console.log('티켓이가 준비 되었어요!');
});

client.on('messageReactionAdd',async (messageReaction,user)=>{

    function SpamTicket(auID,chID){
        return new Discord.MessageEmbed()
            .setColor('#28df99')
            .setDescription(`<@${auID}> 이미 티켓을 여셨어요! <#${chID}>`)
            .setTimestamp()
            .setFooter('근태#5427 - Type $help 🎵','https://cdn.discordapp.com/avatars/774628881910202378/548e0caa288842504514596856039e9c.png?size=256');
    }

    function ticketClosed(auID){
        return new Discord.MessageEmbed()
            .setColor('#28df99')
            .setDescription(`티켓이 닫았어요! by <@${auID}>`)
            .setTimestamp()
            .setFooter('근태#5427 - Type $help 🎵','https://cdn.discordapp.com/avatars/774628881910202378/548e0caa288842504514596856039e9c.png?size=256');
    }

    function ticketDeletePopup(){
        return new Discord.MessageEmbed()
            .setColor('#ff4b5c')
            .setDescription(`이 티켓은 5초 뒤에 삭제가 되요!`)
            .setTimestamp()
            .setFooter('근태#5427 - Type $help 🎵','https://cdn.discordapp.com/avatars/774628881910202378/548e0caa288842504514596856039e9c.png?size=256');
    }

    function noAdmin_close(id){
        return new Discord.MessageEmbed()
            .setColor('#ff4b5c')
            .setDescription(`<@${id}> 관리자 권한이 없어 티켓을 닫을수 없어요..`)
            .setTimestamp()
            .setFooter('근태#5427 - Type $help 🎵','https://cdn.discordapp.com/avatars/774628881910202378/548e0caa288842504514596856039e9c.png?size=256');
    }

    function noAdmin_delete(id){
        return new Discord.MessageEmbed()
            .setColor('#ff4b5c')
            .setDescription(`<@${id}> 관리자 권한이 없어 티켓을 닫을수 없어요..`)
            .setTimestamp()
            .setFooter('근태#5427 - Type $help 🎵','https://cdn.discordapp.com/avatars/774628881910202378/548e0caa288842504514596856039e9c.png?size=256');
    }

    if (messageReaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await messageReaction.fetch();
		} catch (error) {
			console.log('메세지를 가져오는중에 오류가 발생했어요..! 해당 오류가 반복이 된다면 서포트 서버에 문의 부탁 드려요!: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
    }

    if(messageReaction.emoji.name === '❓' && !user.bot){
        mongo.validatePanel(messageReaction.message.id,async (res)=>{
            if(res){
                await messageReaction.users.remove(user.id)
                general.general_ticket(messageReaction.message,user)
            }
        })
    }

    if(messageReaction.emoji.name === '💳' && !user.bot){
        mongo.validatePanel(messageReaction.message.id,async (res)=>{
            if(res){
                await messageReaction.users.remove(user.id)
                paypal.paypal_ticket(messageReaction.message,user)
            }
        })
    }

    if(messageReaction.emoji.name === '🎵' && !user.bot){
        mongo.validatePanel(messageReaction.message.id,async (res)=>{
            if(res){
                await messageReaction.users.remove(user.id)
                resell.resell_ticket(messageReaction.message,user)
            }
        })
    }
    
    if(messageReaction.emoji.name === '🛠️' && !user.bot){
        mongo.validatePanel(messageReaction.message.id,async (res)=>{
            if(res){
                await messageReaction.users.remove(user.id)
                kick.kick_ticket(messageReaction.message,user)
            }
        })
    }

    if(messageReaction.emoji.name === '🔒' && !user.bot){
        mongo.validateTicket_Channel(messageReaction.message.channel.id,async (res)=>{
            if(res){
                if(res.messageID === messageReaction.message.id){
                    await messageReaction.users.remove(user.id)
                    if(!res.status){
                        close.ticket_close(messageReaction.message,user,res)
                    }
                    else{
                        return
                    }
                }
            }
        })
    }

    if(messageReaction.emoji.name === '🔓' && !user.bot){
        mongo.validateTicketPanel_Channel(messageReaction.message.channel.id,async (res)=>{
            if(res){
                if(res.messageID === messageReaction.message.id){
                    await messageReaction.users.remove(user.id)
                    if(res.status === 'closed'){
                        reopen.ticket_reopen(messageReaction.message,user,res,client)
                    }
                    else{
                        return
                    }
                }
            }
        })
    }

    if(messageReaction.emoji.name === '🗒️' && !user.bot){
        mongo.validateTicketPanel_Channel(messageReaction.message.channel.id,async (res)=>{
            if(res){
                if(res.messageID === messageReaction.message.id){
                    await messageReaction.users.remove(user.id)
                    transcript.create_transcript(messageReaction.message,user)
                }
            }
        })
    }

    if(messageReaction.emoji.name === '⛔' && !user.bot){
        mongo.validateTicketPanel_Channel(messageReaction.message.channel.id,async (res)=>{
            if(res){
                if(res.messageID === messageReaction.message.id){
                    await messageReaction.users.remove(user.id)
                    ticket.ticket_delete(messageReaction.message,user)
                }
            }
        })
    }
    
})

/*Invokes When a new message send in discord*/
client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return; //Returns If the prefix is not matching or If the message is sent by BOT

    const args = message.content.slice(prefix.length).split(/ +/); // Spillting up Arguments
    const commandName = args.shift().toLowerCase(); // Converting to Lowercase

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); //Accessing Command from Command Collection in #14

    if (!command) return; // If user command is not matches with our bot command, It returns

    /* If the command should be executed in Guild and the command is executed outside of guild, It'll return with a error message*/
    if (command.guildOnly && message.channel.type !== 'text') {
        function e_invalid() {
            return new Discord.MessageEmbed()
                .setColor('#d40808')
                .setDescription(`개인메세지에서는 명령어를 실행 하실 수 없습니다.`)
                .setTimestamp()
                .setFooter('근태#5427');
        }
        return message.channel.send(e_invalid())
    }

    /* If command needs any argument and user doesn't provide any argument, It returns with a error message'*/
    if (command.args && !args.length) {

        if (command.usage) {
            function e_invalid() {
                return new Discord.MessageEmbed()
                    .setColor('#d40808')
                    .setDescription(`어떤 말도 하지 않으셨습니다., ${message.author}!\n사용법은 다음과 같습니다.K!{command.name} K!{command.usage}\``)
                    .setTimestamp()
                    .setFooter('근태#5427');
            }

            return message.channel.send(e_invalid()).then(msg => {
                msg.delete({ timeout: 10000 })
            })
        }
        else {
            function e_invalid() {
                return new Discord.MessageEmbed()
                    .setColor('#d40808')
                    .setDescription(`어떤 말도 하지 않으셨습니다., ${message.author}!`)
                    .setTimestamp()
                    .setFooter('근태#5427');
            }

            return message.channel.send(e_invalid()).then(msg => {
                msg.delete({ timeout: 10000 })
            })
        }
    }

    /* If command has any cooldown, It'll validate every request */ 
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            function e_invalid() {
                return new Discord.MessageEmbed()
                    .setColor('#d40808')
                    .setDescription(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
                    .setTimestamp()
                    .setFooter('White2001#0530');
            }

            return message.channel.send(e_invalid()).then(msg => {
                msg.delete({ timeout: 10000 })
            })
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    /* Executes command, If any error occurs, It goes to Catch Block */
    try {
        command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        function e_invalid() {
            return new Discord.MessageEmbed()
                .setColor('#d40808')
                .setDescription('There was an error trying to execute that command!')
                .setTimestamp()
                .setFooter('White2001#0530');
        }

        return message.channel.send(e_invalid()).then(msg => {
            msg.delete({ timeout: 10000 })
        })
    }
});

client.login(token); // Bot Login with token