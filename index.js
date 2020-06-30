const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const userRequest = require('./user-request');

const config = require('./config.json');
const filePath = config.parsed_data.path || path.join(__dirname, 'parsed_data');
const places = {
  'novosibirsk': [{text: 'Новосибирск', callback_data: 'novosibirsk'}, {ends: 'Новосибирска'} ],
  'novopichugovo': [{text: 'Новопичугово', callback_data: 'novopichugovo'}, {ends: 'Новопичугово'} ],
  'ordinskoe': [{text: 'Ордынское', callback_data: 'ordinskoe'}, {ends: 'Ордынска'} ],
  'verkh-irmen': [{text: 'Верх-Ирмень', callback_data: 'verkh-irmen'}, {ends: 'Верх-Ирменя'} ]
};
const periods = {
  '1d': [{text: 'на Завтра', callback_data: '1'}],
  '3d': [{text: 'на 3 дня', callback_data: '3'}],
  '10d': [{text: 'на 10 дней', callback_data: '10'}],
}
const actions = {...places, ...periods};
const actionList = Object.keys(actions).map(key => {
  return actions[key][0].callback_data;
})

function buttonGenerator(actions) {
  if(typeof actions === 'object') {
    return Object.keys(actions).map(key => {
      const item = actions[key];
      return [item[0]];
    });
  } else {
    throw Error('Button list is not an object!');
  }
}

const bot = new TelegramBot(config.telegram_bot.token, {polling: true});
bot.on("polling_error", (err) => err ? console.log(err) : console.log('No errors'));

bot.onText(/\/start/, (msg, match) => {
  const opts = {
    reply_to_message_id: msg.message_id,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      inline_keyboard: buttonGenerator(places)
    })
  };
  bot.sendMessage(msg.chat.id, `${msg.chat.first_name ? msg.chat.first_name : msg.chat.username},\nПривет! Я могу рассказать тебе про погоду. Выбирай место.`, opts);
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
 if (isNaN(parseInt(action, 10))) {
   userRequest(chatId, 'city', action);
   const opts = {
     reply_to_message_id: msg.message_id,
     parse_mode: 'HTML',
     reply_markup: JSON.stringify({
       inline_keyboard: buttonGenerator(periods)
     })
   };
   bot.sendMessage(msg.chat.id, `Какой прогноз интересует?`, opts);
 } else {
   userRequest(chatId, 'period', action);
   bot.sendMessage(msg.chat.id, `Generating broadcast...`);
 }
});
