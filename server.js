const AirtablePlus = require('airtable-plus')
const { App } = require('@slack/bolt')
const axios = require('axios')
const qs = require('qs')

const app = new App({
	signingSecret: process.env.SIGNING_SECRET,
	token: process.env.BOT_TOKEN
});
const joinTable = new AirtablePlus({
	apiKey: process.env.AIRTABLE_API_KEY,
	baseID: 'appaqcJtn33vb59Au',
	tableName: 'Join Requests'
})

app.action('invite_member', async ({ ack, body }) => {
	await ack();

	let email = body.message.blocks[1].text.text.split('Email:')[1].split('|')[1].split('>')[0]
	let ts = body.message.ts

	let args = qs.stringify({
		token: process.env.LEGACY_TOKEN,
		email: email
	})
	axios({
		method: 'post',
		url: `https://slack.com/api/users.admin.invite?${args}`
	}).catch(err => console.log(err))

	let record = (await joinTable.read({
		filterByFormula: `{Email Address} = '${email}'`,
		maxRecords: 1
	}))[0]
	await joinTable.update(record.id, {
		'Invited': true
	})

	await app.client.chat.update({
		token: process.env.BOT_TOKEN,
		ts: ts,
		channel: 'G0132DNFE7J',
		blocks: [body.message.blocks[0], body.message.blocks[1],
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Invitation Sent"
					},
					"action_id": "mimmiggie"
				}
			]
		}]
	})
});

app.action('deny', async ({ ack, body }) => {
	await ack();

	let ts = body.message.ts

	await app.client.chat.update({
		token: process.env.BOT_TOKEN,
		ts: ts,
		channel: 'G0132DNFE7J',
		blocks: [body.message.blocks[0], body.message.blocks[1],
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Denied"
					},
					"action_id": "mimmiggie"
				}
			]
		}]
	}).catch(err => console.log(err))
});

app.action('mimmiggie', ({ ack, body }) => {
	ack();
});

(async () => {
	await app.start(process.env.PORT || 3000);
	console.log("⚡️ Bolt app is running!");
})();
