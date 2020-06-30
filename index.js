const TelegramBot = require('node-telegram-bot-api');
const { userRequest, getUserRequests } = require('./user-request');
const { actionGenerator, requestWeather, isWeatherFileExist } = require('./tools');

const config = require('./config.json');
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

const bot = new TelegramBot(config.telegram_bot.token, {polling: true});
bot.on("polling_error", (err) => err ? console.log(err) : console.log('No errors'));

const firstRequest = (msg) => {
  bot.sendMessage(...actionGenerator({
    msg,
    text: `${msg.chat.first_name ? msg.chat.first_name : msg.chat.username},\nПривет! Я могу рассказать тебе про погоду. Выбирай место.`,
    button: places
  }));
}

bot.onText(/\/start/, (msg, match) => {
  firstRequest(msg);
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  if (isNaN(parseInt(action, 10))) {
   userRequest(chatId, 'city', action);
   isWeatherFileExist(action);
   bot.sendMessage(...actionGenerator({
     msg,
     text: `Какой прогноз интересует?`,
     button: periods
   }));
  } else {
    const req = userRequest(chatId, 'period', action);
    const translate = req.city && places[req.city] ? places[req.city][1].ends : ' выбранного места';
    const requests = getUserRequests(chatId);
    if (requests && requests.city) {
      requestWeather(chatId, req, translate).then(html => {
        bot.sendMessage(chatId, html, {parse_mode: 'HTML'});
      });
    } else {
      firstRequest(msg);
    }
  }
});
