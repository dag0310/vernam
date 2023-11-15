'use strict'
require('dotenv').config()

module.exports = {
  NODE_ENV: '"production"',
  API_URL: '"' + process.env.API_URL_PRODUCTION + '"'
}
