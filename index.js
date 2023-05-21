const config = require("./config.json");
const exec = require('child_process').exec;
const Discord = require("discord.js");
const colors = require("colors");
const client = new Discord.Client({
	intents: []
});
const rest = new Discord.REST({
	version: '10'
}).setToken(config.discord.token);


client.on("ready", async () => {
	console.log(`${colors.cyan("[INFO]")} Logged in as ${colors.green(client.user.tag)}`)
	// Load Commands
	console.log(`${colors.cyan("[INFO]")} Loading Commands...`)
	await (async () => {
		try {
			let serverList = config.servers;
			// Add `all` option without overwriting the config
			serverList.push({
				name: "all",
				value: "all"
			});
			console.log(`${colors.cyan("[INFO]")} Registering Commands...`)
			let start = Date.now()
			await rest.put(
				Discord.Routes.applicationCommands(client.user.id), {
					body: [{
						name: "restart",
						description: "Restarts a server.",
						type: 1,
						default_member_permissions: 0,
						options: [{
							name: "server",
							description: "The server to restart.",
							type: 3,
							required: true,
							choices: serverList
						}]
					}]
				},
			);
			serverList.pop(); // Why do you work like this javascript...
			console.log(`${colors.cyan("[INFO]")} Successfully registered commands. Took ${colors.green((Date.now() - start) / 1000)} seconds.`);
		} catch (error) {
			console.error(error);
		}
	})();

	// Log startup time in seconds
	console.log(`${colors.cyan("[INFO]")} Startup took ${colors.green((Date.now() - initTime) / 1000)} seconds.`)
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	switch (interaction.commandName) {
		case "restart":
			await interaction.deferReply({
				ephemeral: true
			});
			let server = interaction.options.getString("server");
			if (server == "all") {
				let servers = config.servers;
				let reply = "```\n";
				for (let i = 0; i < servers.length; i++) {
					if (servers[i].value == "all") continue;
					await exec(`net stop ${servers[i].value}`, async (error, stdout, stderr) => {
						reply += `Successfully stopped ${servers[i].value}.\n`;
						interaction.editReply({
							content: reply,
							ephemeral: true
						});
						await exec(`net start ${servers[i].value}`, (error, stdout, stderr) => {
							reply += `Successfully started ${servers[i].value}.\n`;
							interaction.editReply({
								content: reply,
								ephemeral: true
							});
						});
					});
				}
			} else {
				exec(`net stop ${server}`, (error, stdout, stderr) => {
					if (error) return interaction.editReply({
						content: `An error occured: ${error.message}`,
						ephemeral: true
					});
					if (stderr) return interaction.editReply({
						content: `An error occured: ${stderr}`,
						ephemeral: true
					});
					interaction.editReply({
						content: `Successfully stopped ${server}.`,
						ephemeral: true
					});
					exec(`net start ${server}`, (error, stdout, stderr) => {
						if (error) return interaction.editReply({
							content: `An error occured: ${error.message}`,
							ephemeral: true
						});
						if (stderr) return interaction.editReply({
							content: `An error occured: ${stderr}`,
							ephemeral: true
						});
						interaction.editReply({
							content: `Successfully started ${server}.`,
							ephemeral: true
						});
					});
				});
			}
			break;
	};
});

process.on('SIGINT', async () => {
	await console.log(`${colors.cyan("[INFO]")} Stop received, exiting...`);
	await client.user.setPresence({
		status: "invisible",
		activities: []
	});
	await client.destroy();
	await console.log(`${colors.cyan("[INFO]")} Goodbye!`);
	process.exit(0);
});

console.log(`${colors.cyan("[INFO]")} Starting...`)
// Start timer to see how long startup takes
const initTime = Date.now();
// Login to Discord
client.login(config.discord.token);