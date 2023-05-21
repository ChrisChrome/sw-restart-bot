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
							choices: config.servers
						}]
					}]
				},
			);
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
			interaction.deferReply();
			let server = interaction.options.getString("server");
			exec(`net stop ${server}`, (error, stdout, stderr) => {
				if (error) return interaction.editReply(`An error occured: ${error.message}`);
				if (stderr) return interaction.editReply(`An error occured: ${stderr}`);
				interaction.editReply(`Successfully stopped ${server}.`);
				exec(`net start ${server}`, (error, stdout, stderr) => {
					if (error) return interaction.editReply(`An error occured: ${error.message}`);
					if (stderr) return interaction.editReply(`An error occured: ${stderr}`);
					interaction.editReply(`Successfully started ${server}.`);
				});
			});
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