const Discord = require("discord.js");
module.exports = (client) => {

  /*
  PERMISSION LEVEL FUNCTION

  This is a very basic permission system for commands which uses "levels"
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
  command including the VERY DANGEROUS `eval` and `exec` commands!

  */
  client.permlevel = message => {
    let permlvl = 0;

    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  };

  /*
  GUILD SETTINGS FUNCTION

  This function merges the default settings (from config.defaultSettings) with any
  guild override you might have for particular guild. If no overrides are present,
  the default settings are used.

  */
  client.getGuildSettings = (guild) => {
    const def = client.config.defaultSettings;
    if (!guild) return def;
    const returns = {};
    const overrides = client.settings.get(guild.id) || {};
    for (const key in def) {
      returns[key] = overrides[key] || def[key];
    }
    return returns;
  };
  /**
   * Converts a string or number to blocktext. Input must only be one character
   * 
   * Uses the client.config.emojiConvertReference (Set in config.js) to convert
   * any characters that exist in that file, and has a fallback for
   * alphabetical and numerical characters
   * @constructor
   * @param {String|Number} input The value to be converted
   * @returns {String} A blocktext version of the passed string
   */
  client.toEmojiString = (input) => {
    if (input.toString()) input = input.toString();
    if (client.config.emojiConvertReference && client.config.emojiConvertReference[input]) return client.config.emojiConvertReference[input];
    if (input.length > 1) return new Error("Input too long");
    if (parseInt(input)) return [":zero:",":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"][input];
    if (/[a-z|A-Z]/.test(input)) return input.replace(/[a-z|A-Z]/, i => `:regional_indicator_${i.toLowerCase()}:`);
    return input;
  };
  /*
  SINGLE-LINE AWAITMESSAGE

  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...

  Though useful, this is bad practice, as it holds the async thread
  in memory indefinitely. Use callbacks where possible.

  USAGE

  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);

  */
  client.awaitReply = async (msg, question, limit = 60000) => {
    const filter = m => m.author.id === msg.author.id;
    await msg.channel.send(question);
    try {
      const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: limit,
        errors: ["time"]
      });
      return collected.first().content;
    } catch (e) {
      return false;
    }
  };
  /**
   * Gets user's nickname given a context, if a nickname is not set, the username will be returned
   * @constructor
   * @param {Guild|Message|TextChannel|VoiceChannel|MessageReaction} context The context to check the nickname in
   * @param {User} [user=client.user] The user who's name to check
   * @returns {String} The nickname of the user in the given context
   */
  client.getNickname = (context, user = client.user) => {
    if (context.constructor.name == "MessageReaction") context = context.message;
    if (context.constructor.name == "Message" || "TextChannel" || "VoiceChannel") context = context.guild;
    context = context.members.get(user.id).nickname;
    return context ? context : user.username;
  };
  /**
   * Prompts user to choose string from array with reactions
   * @constructor
   * @param {Channel} channel Discord channel to send the prompt to
   * @param {String[]} options An array of strings representing the choices for the user
   * @param {(Embed|String)} [embed] Used as message to send to channel, will be given reactions up to the number of strings in [options]. Should explain what each option mean
   * @param {(User|String)} [subject] Only allow this user to respond to the prompt
   * @returns {Promise.<String|Error>} Resolves to the string the user chose
   */
  client.multiplePrompt = (channel, options, description, subject) => {
    return new Promise((resolve, reject) => {
      if (options.length == 0) return reject(new Error("No options"));
      if (options.length == 1) return resolve(options[0]);
      if (options.length > 9) return reject(new Error("Too many options"));
      channel.send(description && ["Embed", "String"].includes(description.constructor.name) ? description : new Discord.RichEmbed({
        "title": "Multiple Choice",
        "description": "React to this message to choose.\n\n" + options.map(i => client.toEmojiString(options.indexOf(i) + 1) + " " + i).join("\n")
      })).then(async (prompt) => {
        prompt.reactives = [];
        prompt.createReactionCollector((reaction, user) => user != client.user && reaction.message.reactives.includes(reaction) && (subject ? [subject, subject.id].includes(user.id) : true), {
          "maxEmojis": 1
        }).on("collect", r => {
          r.message.delete();
          if (r.emoji.name == "❌") return reject(new Error("User Rejected"));
          resolve(options[parseInt(r.emoji.identifier.charAt(0)) - 1]);
        });
        await prompt.react("❌").then(r => {
          r.message.reactives.push(r);
        });
        for (let i = 0; i < options.length; i++) {
          await prompt.react((i + 1) + "%E2%83%A3").then(r => {
            r.message.reactives.push(r);
          }).catch(() => { /* The message has already been deleted */ });
        }
      });
    });
  };

  /*
  MESSAGE CLEAN FUNCTION

  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
  client.clean = async (client, text) => {
    if (text && text.constructor.name == "Promise")
      text = await text;
    if (typeof evaled !== "string")
      text = require("util").inspect(text, {
        depth: 1
      });

    text = text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203))
      .replace(client.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");

    return text;
  };

  client.loadCommand = (commandName) => {
    try {
      client.logger.log(`Loading Command: ${commandName}`);
      const props = require(`../commands/${commandName}`);
      if (props.init) {
        props.init(client);
      }
      client.commands.set(props.help.name, props);
      props.conf.aliases.forEach(alias => {
        client.aliases.set(alias, props.help.name);
      });
      return false;
    } catch (e) {
      return `Unable to load command ${commandName}: ${e}`;
    }
  };

  client.unloadCommand = async (commandName) => {
    let command;
    if (client.commands.has(commandName)) {
      command = client.commands.get(commandName);
    } else if (client.aliases.has(commandName)) {
      command = client.commands.get(client.aliases.get(commandName));
    }
    if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;

    if (command.shutdown) {
      await command.shutdown(client);
    }
    const mod = require.cache[require.resolve(`../commands/${commandName}`)];
    delete require.cache[require.resolve(`../commands/${commandName}.js`)];
    for (let i = 0; i < mod.parent.children.length; i++) {
      if (mod.parent.children[i] === mod) {
        mod.parent.children.splice(i, 1);
        break;
      }
    }
    return false;
  };

  /* MISCELANEOUS NON-CRITICAL FUNCTIONS */

  // EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
  // later, this conflicts with native code. Also, if some other lib you use does
  // this, a conflict also occurs. KNOWING THIS however, the following 2 methods
  // are, we feel, very useful in code. 

  // <String>.toPropercase() returns a proper-cased string such as: 
  // "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
  Object.defineProperty(String.prototype, "toProperCase", {
    value: function() {
      return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  });

  // <Array>.random() returns a single random element from an array
  // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
  Object.defineProperty(Array.prototype, "random", {
    value: function() {
      return this[Math.floor(Math.random() * this.length)];
    }
  });

  // `await client.wait(1000);` to "pause" for 1 second.
  client.wait = require("util").promisify(setTimeout);

  // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
  process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    client.logger.error(`Uncaught Exception: ${errorMsg}`);
    // Always best practice to let the code crash on uncaught exceptions. 
    // Because you should be catching them anyway.
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    client.logger.error(`Unhandled rejection: ${err}`);
  });
};