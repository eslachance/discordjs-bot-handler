const Command = require("../base/Command.js");

class Deploy extends Command {
  constructor(client) {
    super(client, {
      name: "deploy",
      description: "This will deploy all slash commands.",
      category: "System",
      usage: "deploy",
      permLevel: "Bot Owner",
      aliases: []
    });
  }

  async run(message, args, level) { // eslint-disable-line no-unused-vars
    // Filter the slash commands to find guild only ones.
    const guildCmds = this.client.slashcmds.filter(c => c.guildOnly).map(c => c.commandData);

    // Now we filter out global commands by inverting the filter.
    const globalCmds = this.client.slashcmds.filter(c => !c.guildOnly).map(c => c.commandData);

    // Give the user a notification the commands are deploying.
    await message.channel.send("Deploying commands!");

    // We'll use set but please keep in mind that `set` is overkill for a singular command.
    // Set the guild commands like this.
    await this.client.guilds.cache.get(message.guild.id)?.commands.set(guildCmds);
    
    // Then set the global commands like this.
    await this.client.application?.commands.set(globalCmds).catch(e => console.log(e));
    
    // Reply to the user that the commands have been deployed.
    await message.channel.send("All commands deployed!");
  }
}

module.exports = Deploy;
