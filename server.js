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
  updateInvitationStatus(body, 'Invitation Sent')
});

app.action('deny', async ({ ack, body }) => {
  await ack();
  updateInvitationStatus(body, 'Denied')
});

app.action('mimmiggie', ({ ack, body }) => {
  ack();
});

async function updateInvitationStatus(body, status) {
  let email
  try {
    email = body.message.blocks[1].text.text.split('Email:')[1].split('|')[1].split('>')[0]
  } catch {
    email = body.message.blocks[1].text.text.split('Email:*')[1].split('*')[0].split('\n')[0].split(' ')[1]
  }
  let ts = body.message.ts

  let record = (await joinTable.read({
    filterByFormula: `{Email Address} = '${email}'`,
    maxRecords: 1
  }))[0]

  if (status === 'Invitation Sent') {
    await joinTable.update(record.id, {
      'Invited': true
    })

    let args = qs.stringify({
      token: process.env.LEGACY_TOKEN,
      email: email
    })
    axios({
      method: 'post',
      url: `https://slack.com/api/users.admin.invite?${args}`
    }).catch(err => console.log(err))
  } else {
    await joinTable.update(record.id, {
      'Denied': true
    })
  }
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
            "text": status === 'Invitation Sent' ? `Invitation sent by @${body.user.name}` : `Denied by @${body.user.name}`
          },
          "action_id": "mimmiggie"
        }
      ]
    }]
  }).catch(err => console.log(err))
}

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
