class slashCommand {

  constructor(client, {
    name = null,
    description = "No description provided.",
    options = [],
    defaultPermissions = true,
    guildOnly = false // false = global, true = guild.
  }) {
    this.client = client;
    this.commandData = { name, description, options, defaultPermissions };
    this.guildOnly = guildOnly;
  }

}

module.exports = slashCommand;
