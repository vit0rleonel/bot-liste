require("./247.js")
const Discord = require("discord.js")
require("discord-reply")
const client = new Discord.Client({ shards: "auto" })
const db = require("quick.db")
const prefix = require("discord-prefix")
const disbut = require("discord-buttons")
disbut(client)
const fetch = require("node-fetch")
const commands = require('./help');
const dotenv = require("dotenv")
require("doenv").config()

var defaultPrefix = 'd.';

client.on("ready", () => {
  console.log(client.user.tag)
  console.log("is ready")
})

client.on("message", async message => {
  const botapproverroleid = db.get(`approverroleid_${message.guild.id}`)
  const botlogcid = db.get(`botlogcid_${message.guild.id}`)
  let privateprefix = prefix.getPrefix(message.author.id)
  let guildPrefix = prefix.getPrefix(message.guild.id)
  if (!privateprefix) privateprefix = guildPrefix
  if (!guildPrefix) guildPrefix = defaultPrefix;

  let args = message.content.slice(guildPrefix.length || privateprefix.length).split(' ');
  if (message.content.startsWith(guildPrefix) && !db.has(`botrole_${message.guild.id}`) && !message.content.startsWith(guildPrefix + "setup")) return message.lineReply("please use d.setup to setup the add bot")
  if (message.content.startsWith(guildPrefix + "setprivateprefix") || message.content.startsWith(privateprefix + "setprivateprefix")) {
    let newprefix = args.slice(1, 2).join(" ")
    if (!newprefix) return message.lineReply("please give a prefix")
    prefix.setPrefix(newprefix, message.author.id)
    await message.lineReply("done now prefix for you is " + "`" + newprefix + "`")
  } else if (message.content.startsWith(guildPrefix + "setprefix") || message.content.startsWith(privateprefix + "setprefix")) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.lineReply('you don\'t have admin perm to use this command');
    let newprefix = args.slice(1, 2).join(" ")
    if (!newprefix) return message.lineReply("please give a prefix")
    prefix.setPrefix(newprefix, message.guild.id)
    await message.lineReply("done now prefix for this guild is " + "`" + newprefix + "`")
  } else if (message.content.startsWith(guildPrefix + "addbot") || message.content.startsWith(privateprefix + "addbot")) {
    const botid = args.slice(1, 2).join("")
    if (db.has(`newbot${botid}`)) return message.lineReply("that bot is already in queue try again in 6 hours")
    const prefix = args.slice(2, 3).join("")
    if (!botid || isNaN(botid)) return message.lineReply("please give a bot ID")
    if (!prefix) return message.lineReply("please give a prefix")
    db.set(`newbot${botid}`, message.author.id)
    await fetch(`https://discord.com/api/users/${botid}`, {
      headers: {
				authorization: `Bot ${process.env.TOKEN}`,
			},
    })
      .then(res => res.json())
      .then(data => {
        const channel = client.channels.cache.find(c => c.id === botlogcid)
        if (!channel) return console.log("no such channel")
        console.log(data)
        const botembed = new Discord.MessageEmbed()
          .setTitle("new bot request")
          .addField("bot id", `${data.id}`)
          .addField("name", `${data.username}`)
          .addField("discriminator", `${data.discriminator}`)
          .setThumbnail(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`)
          .addField("bot owner", message.author.tag)
          .addField("prefix", `${prefix}`)
          .addField("invite", `[invite here](https://discord.com/api/oauth2/authorize?client_id=${botid}&permissions=0&scope=bot%20applications.commands)`)
        message.lineReply("your bot has been submited to the queue please wait till other staffs review it")
        channel.send(`<@&${botapproverroleid}>`, { embed: botembed }).then((msg) => msg.react("<a:check:850724870282674189>"))
      }).catch(err => console.log(err))
  } else if (message.content.startsWith(guildPrefix + "reject") || message.content.startsWith(privateprefix + "reject")) {
    if (!message.member.roles.cache.find(r => r.id === `${botapproverroleid}`)) return message.lineReply(`you need <@&${botapproverroleid}> role to approve/reject bots`)
    const botid = args.slice(1, 2).join("")
    if (!botid || isNaN(botid)) return message.lineReply("please give a bot ID")
    const reason = args.slice(2).join(" ")
    if (!reason) return message.lineReply("please give a reason to reject the bot")
    const ownerid = db.get(`newbot${botid}`)
    if (!ownerid) return message.lineReply("that's not a queued bot")
    await fetch(`https://discord.com/api/users/${botid}`, {
      headers: {
				authorization: `Bot ${process.env.TOKEN}`,
			},
    })
      .then(res => res.json())
      .then(data => {
        const user = client.users.cache.find(u => u.id === `${db.get(`newbot${botid}`)}`)
        const channel = client.channels.cache.find(c => c.id === botlogcid)
        if (!channel) return console.log("no such channel")
        db.delete(`newbot${botid}`)
        const botembed = new Discord.MessageEmbed()
          .setTitle("bot rejected")
          .addField("bot id", `${data.id}`)
          .addField("name", `${data.username}`)
          .addField("discriminator", `${data.discriminator}`)
          .addField("bot approver", message.author.tag)
          .addField("reason", reason)
          .setThumbnail(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`)
          .addField("bot owner", `<@${ownerid}>`)
        message.lineReply("rejected " + `${data.username}${data.discriminator}`)
        channel.send(`<@${ownerid}> your bot got rejected`, { embed: botembed })
        user.send(`your bot ${data.username}#${data.discriminator} was rejected by approver ${message.author.tag}\nbecause of the reason ${reason}`)
      }).catch(err => console.log(err))
  } else if (message.content.startsWith(guildPrefix + "approve") || message.content.startsWith(privateprefix + "approve")) {
    if (!message.member.roles.cache.find(r => r.id === `${botapproverroleid}`)) return message.lineReply(`you need <@&${botapproverroleid}> role to approve/reject bots`)
    const botid = args.slice(1, 2).join("")
    if (!botid || isNaN(botid)) return message.lineReply("please give a bot ID")
    const ownerid = db.get(`newbot${botid}`)
    if (!ownerid) return message.lineReply("that's not a queued bot")
    await fetch(`https://discord.com/api/users/${botid}`, {
      headers: {
				authorization: `Bot ${process.env.TOKEN}`,
			},
    })
      .then(res => res.json())
      .then(async data => {
        const user = client.users.cache.find(u => u.id === `${db.get(`newbot${botid}`)}`)
        const channel = client.channels.cache.find(c => c.id === botlogcid)
        if (!channel) return console.log("no such channel")
        db.delete(`newbot${botid}`)
        const botembed = new Discord.MessageEmbed()
          .setTitle("bot approved")
          .addField("bot id", `${data.id}`)
          .addField("name", `${data.username}`)
          .addField("discriminator", `${data.discriminator}`)
          .addField("bot approver", message.author.tag)
          .setThumbnail(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`)
          .addField("bot owner", `<@${ownerid}>`)
        message.lineReply("approved " + `${data.username}${data.discriminator}`)
        const botuser = message.guild.members.cache.find(u => u.id === botid)
        const botrole = message.guild.roles.cache.find(r => r.id === db.get(`botrole_${message.guild.id}`))
        const developeruser = message.guild.members.cache.find(u => u.id === ownerid)
        const botdeveloperrole = message.guild.roles.cache.find(r => r.id === db.get(`developerrole_${message.guild.id}`))
        botuser.roles.add(botrole)
        await developeruser.roles.add(botdeveloperrole).catch(err => {
          message.author.send(`i got some errors doing that error is ${err}`)
        })
        channel.send(`<@${ownerid}> your bot got approved`, { embed: botembed })
        user.send(`your bot ${data.username}#${data.discriminator} was approved by approver ${message.author.tag}`)
      }).catch(err => console.log(err))
  } else if (message.content.startsWith(guildPrefix + "help") || message.content.startsWith(privateprefix + "help")) {
        let addbot = new disbut.MessageButton()
        .setStyle('url')
        .setLabel('add me to your servers') 
        .setURL("https://discord.com/oauth2/authorize?client_id=804651902896963584&scope=bot%20applications.commands&permissions=8589934591")
        let embed =  new Discord.MessageEmbed()
          .setTitle('help')
          .setColor('#12d8f3')
          .setFooter(`Requested by: ${message.member ? message.member.displayName : message.author.username}`, message.author.displayAvatarURL())
          .setThumbnail(client.user.displayAvatarURL());
        if (!args[1])
          embed
            .addField("Symbols", "<> Argument is required\n[] - Argument is optional")
            .setDescription(Object.keys(commands).map(command => `\`${command.padEnd(Object.keys(commands).reduce((a, b) => b.length > a.length ? b : a, '').length)}\` <a:arrow:875628899604762624> ${commands[command].description}\ncategory:\`${commands[command].category}\``).join('\n'));
        else {
          if (Object.keys(commands).includes(args[1].toLowerCase()) || Object.keys(commands).map(c => commands[c].aliases || []).flat().includes(args[1].toLowerCase())) {
            let command = Object.keys(commands).includes(args[1].toLowerCase())? args[1].toLowerCase() : Object.keys(commands).find(c => commands[c].aliases && commands[c].aliases.includes(args[1].toLowerCase()));
            embed
              .setTitle(`COMMAND - ${command}`)
              .addField("Symbols", "<> Argument is required\n[] - Argument is optional")
            if (commands[command].aliases)
              embed.addField('Command aliases', `\`${commands[command].aliases.join('`, `')}\``);
              if (!commands[command].category && privateprefix != guildPrefix)
              embed
              .addField('DESCRIPTION', commands[command].description)
              .addField('FORMAT-private prefix', `\`\`\`${privateprefix}${commands[command].format}\`\`\``)
              .addField("FORMAT-guild prefix", `\`\`\`${guildPrefix}${commands[command].format}\`\`\``)
              if (!commands[command].category && privateprefix == guildPrefix)
              embed
              .addField('DESCRIPTION', commands[command].description)
              .addField("FORMAT-guild prefix", `\`\`\`${guildPrefix}${commands[command].format}\`\`\``)
              if (privateprefix != guildPrefix)
            embed
              .addField('DESCRIPTION', commands[command].description)
              .addField("CATEGORY", commands[command].category)
              .addField('FORMAT-private prefix', `\`\`\`${privateprefix}${commands[command].format}\`\`\``)
              .addField("FORMAT-guild prefix", `\`\`\`${guildPrefix}${commands[command].format}\`\`\``)
              if (privateprefix == guildPrefix)
            embed
              .addField('DESCRIPTION', commands[command].description)
              .addField("CATEGORY", commands[command].category)
              .addField("FORMAT-guild prefix", `\`\`\`${guildPrefix}${commands[command].format}\`\`\``)
          } else {
            embed
              .setColor('RED')
              .setDescription('This command does not exist. Please use the help command without specifying any commands to list them all.');
          }
        }
        message.channel.send(embed, addbot);
      } else if (message.content.startsWith(guildPrefix + "set-bot-prefix-name") || message.content.startsWith(privateprefix + "set-bot-prefix-name")) {
        if (!message.member.roles.cache.find(r => r.id === `${botapproverroleid}`)) return message.lineReply(`you need <@&${botapproverroleid}> role to edit bots`)
        const bot = message.mentions.members.last()
        const prefix = args.slice(2).join(" ")
        if (!bot || !bot.user.bot) return message.lineReply("please mention a bot")
        if (!prefix) return message.lineReply("please give a prefix")
        await bot.setNickname("").catch(err => {
          return message.lineReply(`i got some errors doing that the error is ${err}`)
        })
        await bot.setNickname(prefix + "|" + bot.displayName).catch(err => {
          return message.lineReply(`i got some errors doing that the error is ${err}`)
        })
        await message.lineReply(`done the prefix bot name for this bot is now set to ${bot.displayName}`)
      } else if (message.content.startsWith(guildPrefix + "setup") || message.content.startsWith(privateprefix + "setup")) {
        if (!message.member.hasPermission('ADMINISTRATOR')) return message.lineReply('you don\'t have admin perm to use this command');
        message.channel.send("please give a role ID for the bot approver role").then(() => {
    message.channel.awaitMessages(m => m.author.id === message.author.id, {
					max: 1,
					time: 30000,
					errors: ['time']
				})
    .then(col => {
      const msg = col.first().content.toString()
      if (isNaN(msg)) return message.lineReply("invalid role ID provided")
      db.set(`approverroleid_${message.guild.id}`, msg)
      message.lineReply("done now please give a bot logging channel id").then(() => {
    message.channel.awaitMessages(m => m.author.id === message.author.id, {
					max: 1,
					time: 30000,
					errors: ['time']
				})
    .then(col => {
      const msg = col.first().content.toString()
      if (isNaN(msg)) return message.lineReply("invalid channel ID provided")
      db.set(`botlogcid_${message.guild.id}`, msg)
      message.lineReply("done now please give a role ID for the bot developer role").then(() => {
    message.channel.awaitMessages(m => m.author.id === message.author.id, {
					max: 1,
					time: 30000,
					errors: ['time']
				})
    .then(col => {
      const msg = col.first().content.toString()
      if (isNaN(msg)) return message.lineReply("invalid role ID provided")
      db.set(`developerrole_${message.guild.id}`, msg)
      message.lineReply("done now please give a role ID for the bot role").then(() => {
    message.channel.awaitMessages(m => m.author.id === message.author.id, {
					max: 1,
					time: 30000,
					errors: ['time']
				})
    .then(col => {
      const msg = col.first().content.toString()
      if (isNaN(msg)) return message.lineReply("invalid role ID provided")
      db.set(`botrole_${message.guild.id}`, msg)
      message.lineReply("the setup is done")
      
    })
    .catch(err => {
      message.channel.send("you didn't answer the bot developer role ID in time please try again")
      console.log(err)
    })
    })
      
    })
    .catch(err => {
      message.channel.send("you didn't answer the bot role ID in time please try again")
      console.log(err)
    })
    })
      
    })
    .catch(err => {
      message.channel.send("you didn't answer the channel ID in time please try again")
      console.log(err)
    })
    })
      
      
    })
    .catch(err => {
      message.channel.send("you didn't answer the bot approver ID in time please try again")
      console.log(err)
    })
    })
      }
})


client.login(process.env.TOKEN)
