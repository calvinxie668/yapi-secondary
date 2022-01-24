const axios = require('axios');
// 以下axios 防抖 
const Cancel = axios.CancelToken

let httpPending = []

const http = axios.create()
function removeHttpPending(config) {
  
  httpPending.map((item, index, arr) => {
    if (item.u === config.url + '&' + config.method + JSON.stringify(config.data) + JSON.stringify(config.params)) {
      console.warn(`${config.url}: 短时间内重复请求`)
      item.f()
      arr.splice(index, 1)
    }
    return config
  })
}

function clearHttpPending() {
  httpPending = []
}

http.interceptors.request.use((config) => {
  removeHttpPending(config)
  config.cancelToken = new Cancel(c => {

    httpPending.push({ u: config.url + '&' + config.method + JSON.stringify(config.data) + JSON.stringify(config.params), f: c })
  })

  return config
}, (err) => {
  return Promise.reject(err)
})

http.interceptors.response.use((res) => {
  clearHttpPending()
  return Promise.resolve(res)
}, (err) => {
  console.error(err)
  return Promise.reject(err)
})

module.exports = http