const fs = require('fs');
const path = require('path');
const moment = require('moment');

const config = require('./config.json');

const { getFileName, getWeatherFromWeb, getWeatherTemplate } = require('./weather/weather_parser');

const filePath = config.parsed_data.path || path.join(__dirname, 'weather', 'parsed_data');

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

function actionRequestGenerator({ msg, text, button }) {
  const opts = {
    reply_to_message_id: msg.message_id,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      inline_keyboard: buttonGenerator(button)
    })
  };
  return [msg.chat.id, text, opts];
}

function isWeatherFileExist(city) {
  const time = moment().format(config.parsed_data.time_format);
  const file = filePath + '/' + getFileName(city, time);
  return new Promise(resolve => {
    fs.access(file, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  })
}

async function requestWeather(chatId, { city, period }, cityTranslate) {
  const time = moment().format(config.parsed_data.time_format);
  const file = filePath + '/' + getFileName(city, time);
  const fileExist = await isWeatherFileExist(city);
  if (fileExist) {
    const html = await getWeatherTemplate({cityTranslate, file, period});
    return html;
  } else {
    const weather = await parseWeather(city, file);
    const html = await getWeatherTemplate({cityTranslate, file, period});
    return html;
  }
}

function parseWeather(city, file) {
  return new Promise((resolve, reject) => {
    getWeatherFromWeb({city, file}).then(result => {
      if (result) {
        console.log('Weather has been ready');
        resolve();
      } else {
        reject('Weather has not been ready. Parse error.');
      }
    })
  })
}

module.exports = {
  actionGenerator: actionRequestGenerator,
  requestWeather,
  isWeatherFileExist
}
