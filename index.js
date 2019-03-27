var Botkit = require('botkit')
var Airtable = require('airtable')
var _ = require('lodash')
var Airbot = require('./airbot.js').default

const {
  Record,
  base
} = Airbot({
  botName: 'kid',
  defaultRecord: {}
})

var redisConfig = {
  url: process.env.REDISCLOUD_URL
}
var redisStorage = require('botkit-storage-redis')(redisConfig)

console.log("Booting kid bot")

var controller = Botkit.slackbot({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
  scopes: ['bot', 'chat:write:bot'],
  storage: redisStorage
});

controller.startTicking();

controller.setupWebserver(process.env.PORT, function(err,webserver) {
    controller.createWebhookEndpoints(controller.webserver)
    controller.createOauthEndpoints(controller.webserver)
});

// begin the cat rescue quest
const startCatConversation = (message, record) => {
  var {text, user, team_id} = message

  var apps = record.apps
  var bankUser = apps.bank

  bot.startPrivateConversation(message, (err, convo) => {
    // What shall I call my kitty this time...
    var catNames = [
      'floofy',
      'Mr. Poops',
      'furryface',
      'pillowpants',
      'ploofyploof',
      'plop-plop',
      'doopsie',
      'boopsie',
      'dumpling',
      'snugglypoo',
      'Sir Snuggles',
      'flopsy'
    ]

    var catName = _.sample(catNames)
    _.remove(catNames, catName)
    var catNameMistake = _.sample(catNames)

    console.log(`Maybe User ${user} can find me another cat?\nI'll call it ${catNameMistake}! ...no wait, ${catName}!}`)

    convo.say({
      delay: 0,
      text: `scuse me sirrah, scuse me...`
    })

    convo.say({
      delay: 2000,
      text: `my cat ${catName} is missing.`
    })

    convo.say({
      delay: 2000,
      text: `poor ${catName} _cough cough_ :(`
    })

    convo.ask({
      delay: 2000,
      text: `could you help me find him? please, please??`
    }, [
      {
        pattern: ':cat:',
        callback: function(response,convo) {
          var catNameUpper = catName.toUpperCase()
          var catNameMistakeUpper = catNameMistake.toUpperCase()
          var catReply = `${catNameMistakeUpper}!!!! ... *_cough_* i mean, ${catNameUpper}!!`
          catReply += `\noh i am ever so happy sirrah, thank you thank you!!`
          catReply += `\ni shall repay you with what meager coins i have in my pocket!`

          console.log(`${user}: ${response.text}`)
          console.log(`Thanks for the cat, ${user}`)

          convo.say({
            delay: 1500,
            text: catReply
          })

          bot.say({
          setTimeout(() => bot.say({
            user: `@${bankUser}`,
            channel: `@${bankUser}`,
            text: `<@${bankUser}> give <@${user}> 2`
          }), 4000)

          setTimeout(() => bot.say({
            user: `@${apps.toriel}`,
            channel: `@${apps.toriel}`,
            text: `<thanks, <@${user}> gave me a cat`
          }), 6000)

          convo.next()
        }
      },
      {
        default: true,
        callback: function(response,convo) {
          console.log(`${user}: ${response.text}`)
          console.log(`That's not a cat, ${user}. I'll just have to complain about ${catName} again.`)
          
          convo.say({
            delay: 1500,
            text: `i shall be ever so sad if anything happens to ${catName} :(`
          })
          convo.say({
            delay: 1500,
            text: `he is but a small weak kitty...`
          })

          convo.repeat()
          convo.next()
        }
      }
    ], {})
  })
}

// @bot hello --> Begins the Cat Rescue quest
controller.hears(/hello/i, 'direct_message', (bot, message) => {
  // console.log(message)
  var {text, user, team_id} = message

  console.log(`This ${user} person is greeting me... "${text}", they say.`)

  Record(user, team_id, record => {
    startCatConversation(message, record)
  })
})

// Introduced by toriel --> Begins the Cat Rescue quest
controller.hears(/meet <@([A-z|0-9]+)>/i, 'direct_message', (bot, message) => {
  var {text, user, team_id, match} = message
  var target = match[1]

  var fakeMessage = {
    user: target,
    team_id,
    channel: '@'+target,
  }

  Record(user, team_id, record => {
    startCatConversation(fakeMessage, record)
  })
})

controller.hears('.*', 'direct_mention,direct_message', (bot, message) => {
  var {text, user} = message
  console.log(message)
  console.log(`Received unhandled message from User ${user}:\n${text}`)

  // Ignore if reply is in a thread. Hack to work around infinite bot loops.
  if (_.has(message.event, 'parent_user_id')) return

  bot.replyInThread(message, 'oh uhmm sorry I don\'t understand...')
})