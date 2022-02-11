const { promisify } = require('util')
const { pipeline } = require('stream')
const pipelineAsync = promisify(pipeline)

module.exports = { pipelineAsync }
