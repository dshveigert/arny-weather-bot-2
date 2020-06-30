const rp = require('request-promise');
const fs = require('fs');
const cheerio = require('cheerio'); // https://cheerio.js.org/
const moment = require('moment');
const catalogUrl = ['https://yandex.ru/pogoda/', '/details?via=ms'];

function getFileName(city, time) {
  return `${city}_${time}.json`;
}

function getWeatherString(file) {
  return new Promise((resolve, reject) => {
    fs.access(file, fs.constants.F_OK, (err) => {
      if (err) {
        reject(`[getWeatherString] ${file} \n ${err} does not exist`);
      } else {
        fs.readFile(file, 'utf8', (err, data) => {
          if (err) throw err;
          resolve(JSON.parse(data));
        });
      }
    });
  });
}

function getWeatherFromWeb({ city, file }) {
  const url = `${catalogUrl[0]}${city}${catalogUrl[1]}`;
  return new Promise((resolve) => {
    rp(url)
        .then(function(html){
          //success!
          var $ = cheerio.load(html);
          const day = [];
          let j = 0;
          $('.forecast-details-segment .card').each((i, item) => {
            const htmlDate = $(item).contents('.forecast-details__day');

            let date, monthString = 0, weather = [];
            if (htmlDate) {
              const htmlMonth = $(item).find('.forecast-details__weekday').children('.forecast-details__day-month');
              const htmlDayName = $(item).find('.forecast-details__weekday').children('.forecast-details__day-name');
              const mainInfo = $(item).find('.forecast-details__day-info').children('.weather-table');

              date = htmlDate.attr('data-anchor');
              monthString = htmlMonth.text();
              dayNameString = htmlDayName.text();
              const weatherHtml = mainInfo.find('.weather-table__row');
              weatherHtml.each((i, tr) => {
                const temp = $(tr).find('.weather-table__body-cell_type_daypart .temp__value').first().text();
                const condition = $(tr).find('.weather-table__body-cell_type_condition').text();
                const pressure = $(tr).find('.weather-table__body-cell_type_air-pressure').text();
                const humidity = $(tr).find('.weather-table__body-cell_type_humidity').text();
                const windDirection = $(tr).find('.weather-table__wind-direction').text();
                const windSpeed = $(tr).find('.wind-speed').text();

                weather.push({temp, condition, pressure, humidity, wind: [windSpeed, windDirection]})
              });

              if (date) {
                day.push({"id": j, date, month: monthString, day: dayNameString, weather});
                j++;
              }
            }
          })

          if (day) {
            console.log('Found: ', day.length, ' lines');
          }
          return day;
        })
        .then(data => {
          fs.writeFile(`${file}`, JSON.stringify({
            data,
            name: file,
            time: moment().format('X'),
            city,
            site: url
          }), function(err) {
            if(err) {
              return console.log(err);
            }
            console.log("File was saved!", file);

            resolve(true);
          });
        })
        .catch(function(err){
          //handle error
          console.log('Error', err);
        });
  });
}

async function getWeatherTemplate({ cityTranslate, file, period }) {
  const weather = await getWeatherString(file);
  const days = +period === 1 ? weather.data.filter((item, i) => i === 1) : weather.data;

  try {
    const n = '\n';
    const s = ' ';
    let weatherHtml = '';
    // weatherHtml += `<a href="${weather.site}">Погода на яндексе</a>`;
    weatherHtml += 'Прогноз для ';
    weatherHtml += cityTranslate + n + n;

    console.log('weather.data', weather.data, days);
    days.forEach((e, j) => {
      if (j < +period) {
        weatherHtml += e.date + s + e.month + ', ' + e.day + n;
        e.weather.forEach((w, i) => {
          if (i === 1) {
            weatherHtml += 'День: ' + n;
            weatherHtml += w.condition + ',' + s + w.temp + n;
            weatherHtml += w.wind[1] + s + w.wind[0] + 'м/c' + n;
            weatherHtml += w.pressure + 'мм р.ст.' + n;
          }
          if (i === 3) {
            weatherHtml += 'Ночь: ' + n;
            weatherHtml += w.condition + ',' + s + w.temp + n;
            weatherHtml += w.wind[1] + s + w.wind[0] + 'м/c' + n;
            weatherHtml += w.pressure + 'мм р.ст.' + n;
          }
        })
        weatherHtml += n + n;
      }
    });
    return weatherHtml;

  } catch (err) {
    console.log('getting File error', err);
  }
}


module.exports = {
  getFileName,
  getWeatherFromWeb,
  getWeatherTemplate
}
