const fs = require('fs')
const { ensureFileSync } = require('fs-extra')
const { join } = require('path')
const busboyCons = require('busboy')
const { pipelineAsync } = require('./util')

const FILE_EVENT_NAME = 'file-uploaded'

class UploadHandler {
  #io
  #socketId

  constructor(io, socketId) {
    this.#io = io
    this.#socketId = socketId
  }

  registerEvents(headers, onFinish) {
    const busboy = busboyCons({ headers });

    busboy.on('file', this.#onFile.bind(this));
    busboy.on('finish', onFinish);

    return busboy
  }

  #handleFileBytes(filename) {
    async function* handleData(data) {
      for await (const item of data) {
        const size = item.length

        this.#io.to(this.#socketId).emit(FILE_EVENT_NAME, size)

        yield item
      }
    }

    return handleData.bind(this)
  }

  async #onFile(fieldname, file, filename) {
    const saveTo = join(__dirname, '../', 'downloads', `${Date.now()+filename.filename}`)

    ensureFileSync(saveTo)

    await pipelineAsync(
      file,
      this.#handleFileBytes.apply(this, [filename]),
      fs.createWriteStream(saveTo),
    )
  }
}

module.exports = UploadHandler
