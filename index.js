var Botkit = require('botkit')
var Airtable = require('airtable')
var _ = require('lodash')

var base = new Airtable({apiKey: process.env.AIRTABLE_KEY}).base(process.env.AIRTABLE_BASE);

var redisConfig = {
  url: process.env.REDISCLOUD_URL
}
var redisStorage = require('botkit-storage-redis')(redisConfig)

console.log("Booting kid bot")

var startState = 'Cat Requested'

function createCatQuestState(user, cb = () => {}) {
  console.log(`Creating balance for User ${user}`)
  
  base('States').create({
    "User": user,
    "CatQuest": startState
  }, function(err, record) {
      if (err) { console.error(err); return; }
      console.log(`New record created for User ${user}`)
      // console.log(record)
      cb(startState, record)
  });
}

function setCatQuestState(id, state, cb = () => {}) {
  console.log(`Setting CatQuest for Record ${id} to ${state}`)

  base('States').update(id, {
    "CatQuest": state
  }, function(err, record) {
    if (err) { console.error(err); return; }
    console.log(`CatQuest for Record ${id} set to ${state}`)
    cb(state, record)
  })
}

function getCatQuestState(user, cb = () => {}) {
  console.log(`Retrieving CatQuest for User ${user}`)

  base('States').select({
    filterByFormula: `User = "${user}"`
  }).firstPage(function page(err, records) {
    if (err) {
      console.error(err)
      return
    }

    if (records.length == 0) {
      console.log(`No CatQuest state found for User ${user}.`)
      createCatQuestState(user, cb)
    }
    else {
      var record = records[0]
      var fields = record.fields
      var state = fields['CatQuest']
      console.log(`CatQuest state for User ${user} is ${state}`)
      console.log(fields)
      cb(balance, record)
    }
  })
}

var controller = Botkit.slackbot({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
  scopes: ['bot', 'chat:write:bot'],
  storage: redisStorage
});

controller.setupWebserver(process.env.PORT, function(err,webserver) {
    controller.createWebhookEndpoints(controller.webserver)
    controller.createOauthEndpoints(controller.webserver)
});

var bot = controller.spawn({
});

bot.say({
  text: 'Awake',
  channel: '@UDK5M9Y13'
});

controller.hears(['question me'], 'message_received', function(bot,message) {


});

// @bot hello --> Begins the Cat Rescue quest
controller.hears(/hello/i, 'direct_message', (bot, message) => {
  // console.log(message)
  var {text, user} = message

  console.log(`This ${user} person is greeting me... "${text}", they say.`)

  // start a conversation to handle this response.
  bot.startConversation(message, function(err,convo) {

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
      'Sir Snuggles'
    ]
  
    var catName = _.sample(catNames)
    _.remove(catNames, catName)
    var catNameMistake = _.sample(catNames)

    console.log(`Mayber User ${user} can find me another cat?\nI'll call it ${catNameMistake}! ...no wait, ${catName}!}`)

    var reply = `scuse me sirrah, scuse me...\nmy cat ${catName} is missing.\n\npoor ${catName} _cough cough_ :(`

    var catNameUpper = catName.toUpperCase()
    var catNameMistakeUpper = catNameMistake.toUpperCase()
    var catReply = `${catNameMistakeUpper}!!!! ... *cough* i mean, ${catNameUpper}!!`
    catReply += `\noh i am ever so happy sirrah, thank you thank you!!`
    catReply += `\ni shall repay you with what meager coins i have in my pocket!`

    console.log(`*ahem* let's rehearse for ${user}...\n${catReply}`)

    convo.ask({
      user,
      channel: user,
      text: reply
    }, [
      {
        pattern: ':cat:',
        callback: function(response,convo) {
          console.log(`Thanks for the cat, ${user}`)
          convo.say(catReply)
          convo.next()
        }
      },
      {
        default: true,
        callback: function(response,convo) {
          console.log(`Continuing to complain to ${user} about ${catName}`)
          convo.say(`i shall be ever so sad if anything happens to ${catName} :(`)
          setTimeout(() => 
            convo.say(`he is but a small weak kitty...`),
            1000
          )
          convo.next()
        }
      }
    ],{},'default')

  })
})

controller.hears('.*', 'direct_mention,direct_message', (bot, message) => {
  var {text, user} = message
  console.log(`Received unhandled message from User ${user}:\n${text}`)

  bot.replyInThread(message, 'oh uhmm sorry I don\'t understand...')
})