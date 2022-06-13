const fs = require('fs')

function getStringDate() {
  return new Date().toISOString().split('T')[0]
}

async function timeout(ms) {
  return new Promise((res) => setTimeout(() => res(true), ms))
}

async function saveInfo(file, content) {
  return new Promise((resolve, reject) => {
    try {
      const currentRawData = fs.readFileSync(file)
      const currentData = JSON.parse(currentRawData)

      currentData.push(content)

      fs.writeFile(file, JSON.stringify(currentData), (error) => {
        return error ? reject(error) : resolve(true)
      })
    } catch (error) {
      console.warn('Attention: cannot save info')
      console.error(error)
      reject(error)
    }
  })
}

async function readInfo(file) {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(file, 'utf8', (error, jsonString) => {
        if (error) return reject(error)

        resolve(JSON.parse(jsonString))
      })
    } catch (error) {
      console.warn('Attention: cannot read info')
      console.error(error)
      reject(error)
    }
  })
}

module.exports = {
  getStringDate,
  timeout,
  saveInfo,
  readInfo,
}
