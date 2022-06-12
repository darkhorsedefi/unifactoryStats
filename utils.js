const fs = require('fs')

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
      console.warning('Attention: cannot save info')
      console.error(error)
      reject(error)
    }
  })
}

module.exports = {
  saveInfo,
}
