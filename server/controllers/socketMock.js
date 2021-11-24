const yapi = require('../yapi.js');
const baseController = require('./base.js');
const socketMockModel = require('../models/socketMock.js');
const socketModel = require('../models/socket.js');
const cronModel = require('../models/cron.js');
const mockExtra = require('../../common/mock-extra.js');
const _ = require('underscore');
const advModel = require('../../exts/yapi-plugin-advanced-mock/advMockModel.js');
const Mock = require('mockjs');
const schedule = require('node-schedule');
const axios = require('axios');


const startCron = (name, step=1, callback) => {
  if(!name && typeof callback != 'function') return
  return new Promise(resolve => {
    schedule.scheduleJob(name, `*/${step} * * * * *`, async () => {
      let cb =  await callback();
      resolve(cb)
    })

  })
}

const cancelCron = (name) => {
  if(!name || schedule.scheduledJobs[name] == undefined) return
  console.log(schedule.scheduledJobs)
  schedule.scheduledJobs[name].cancel();
}

class socketMockController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(socketMockModel);
    this.socketModel = yapi.getInst(socketModel);
    this.advModel = yapi.getInst(advModel);
    this.cronModel = yapi.getInst(cronModel);
  }
/**
 * socket mock 拉取接口
 * @param {*} ctx 
 * @returns 
 */
  async getMockJson(ctx) {
    const { req_msg_type } = ctx.params;
    let socket_list = await this.socketModel.listByReqMsgType(req_msg_type);
    if(!socket_list) {
      const result = {
        success: false,
        msg: '请求参数不存在',
        code: 100,
        content: null,
      }
      return ctx.body = result;
    }
    let mock_data = await this.advModel.get(socket_list._id);
    let mock_script = mock_data && mock_data.mock_script;
    let is_mock_open =mock_data && mock_data.enable;
    try {
      let res;
      res = socket_list.res_body;
      try {
        if (socket_list.res_body_type === 'json') {
          if (socket_list.res_body_is_json_schema === true) {
            //json-schema
            const schema = yapi.commons.json_parse(socket_list.res_body);
            res = yapi.commons.schemaToJson(schema, {
              alwaysFakeOptionals: true
            });
          } else {
            // console.log('header', ctx.request.header['content-type'].indexOf('multipart/form-data'))
            // 处理 format-data
          
            if (
              _.isString(ctx.request.header['content-type']) &&
              ctx.request.header['content-type'].indexOf('multipart/form-data') > -1
            ) {
              ctx.request.body = ctx.request.body.fields;
            }
            // console.log('body', ctx.request.body)
  
            res = mockExtra(yapi.commons.json_parse(socket_list.res_body), {
              query: ctx.request.query,
              body: ctx.request.body,
              params: Object.assign({}, ctx.request.query, ctx.request.body)
            });
          }
          try {
            res = Mock.mock(res);
          } catch (e) {
            console.log('err', e.message);
            yapi.commons.log(e, 'error');
          }
        }
        let context = {
          ctx: ctx,
          mockJson: res,
          resHeader: {},
          httpCode: 200,
          delay: 0
        };
        if(is_mock_open && !!mock_script) {
          await yapi.commons.handleMockScript(mock_script, context);
        }
        const result = {
          success: true,
          msg: '成功',
          code: context.httpCode,
          content: context.mockJson,
          rspClass: socket_list.res_msg_body,
          rspMsgType: socket_list.res_msg_type
        }
        return ctx.body = result;
      } catch (e) {
        yapi.commons.log(e, 'error');
        return (ctx.body = {
          errcode: 400,
          errmsg: '解析出错，请检查。Error: ' + e.message,
          data: null
        });
      }
    } catch (e) {
      return ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async openMockPush(ctx) {
    const { socket_id, minute, times, stock_codes, cron_id } = ctx.params;
    if(!socket_id) {
      return ctx.body = yapi.commons.resReturn(null, 400, 'socket接口不能为空');
    }
    if(!cron_id) {
      return ctx.body = yapi.commons.resReturn(null, 400, '任务id不能为空');
    }
    if(!stock_codes) {
      return ctx.body = yapi.commons.resReturn(null, 400, '股票代码不能为空');
    }
    let socket_list = await this.socketModel.get(socket_id);
    const { topic_id, push_msg_type, push_msg_body } = socket_list;
    let mock_data = await this.advModel.get(socket_id);

    let mock_script = mock_data && mock_data.mock_script;
    let is_mock_open = mock_data && mock_data.enable;
    try {
      let res;
      res = socket_list.res_body;
      try {
        if (socket_list.res_body_type === 'json') {
          if (socket_list.res_body_is_json_schema === true) {
            //json-schema
            const schema = yapi.commons.json_parse(socket_list.res_body);
            res = yapi.commons.schemaToJson(schema, {
              alwaysFakeOptionals: true
            });
          } else {
            // console.log('header', ctx.request.header['content-type'].indexOf('multipart/form-data'))
            // 处理 format-data
          
            if (
              _.isString(ctx.request.header['content-type']) &&
              ctx.request.header['content-type'].indexOf('multipart/form-data') > -1
            ) {
              ctx.request.body = ctx.request.body.fields;
            }
            // console.log('body', ctx.request.body)
  
            res = mockExtra(yapi.commons.json_parse(socket_list.res_body), {
              query: ctx.request.query,
              body: ctx.request.body,
              params: Object.assign({}, ctx.request.query, ctx.request.body)
            });
            console.log('res',res)
          }
          try {
            res = Mock.mock(res);
          } catch (e) {
            console.log('err', e.message);
            yapi.commons.log(e, 'error');
          }
        }
        let context = {
          ctx: ctx,
          mockJson: res,
          resHeader: {},
          httpCode: 200,
          delay: 0
        };
        if(is_mock_open && !!mock_script) {
          await yapi.commons.handleMockScript(mock_script, context);
        }
        // console.log(context.mockJson);
        // const content = JSON.stringify(context.mockJson.data);
        // console.log(context.mockJson.data)
        const callback = () => {
          console.log('this is a cron job!')
          return new Promise((resolve) => {
            const stockCodes = stock_codes.split(',');
            let i = 0;
            let freq = 1;
            if(times && minute) {
                freq = Math.ceil(times/(minute * 60)) >= 1 ? Math.ceil(times/(minute * 60)) : 1;
            }
            while(i < freq) {
              
              Promise.all(stockCodes.map(code => {
                axios.post('http://192.168.90.62:7369/mock/push',{
                  "topicId": topic_id,
                  "content": context.mockJson.data,
                  "code": code,
                  "notifyMsgType": push_msg_type,
                  "notifyRespose": push_msg_body
                })
                .then(res => {
                  console.log(res.data)
                  resolve(res.data)
                })
                .catch(err => {
                  // console.log(err)
                  resolve({data: { code: '100'}})
                  cancelCron('cron' + cron_id);
                })
              }))
              i++
            }
          })
        }

        const result = await startCron('cron' + cron_id, 1, callback);
        if(result && result.code === 200) {
          ctx.body = yapi.commons.resReturn({success: true, msg: '开始推送', data: null})
        } else {
          ctx.body = yapi.commons.resReturn({success: false, msg: '推送失败', data: null})
        }
      } catch (e) {
        yapi.commons.log(e, 'error');
        return (ctx.body = {
          errcode: 400,
          errmsg: '解析出错，请检查。Error: ' + e.message,
          data: null
        });
      }
    } catch (e) {
      return ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async cancelMockPush(ctx) {
    let cron_id = ctx.params.cron_id;
    if(!cron_id) {
      return ctx.body = yapi.commons.resReturn(null, 400, '任务id不能为空');
    }
    console.log('cancel cron');
    cancelCron('cron' + cron_id);
      console.log('=======shcjobs start=========')
      console.log(schedule.scheduledJobs)
      console.log('=======shcjobs end=========')
    ctx.body = yapi.commons.resReturn({success: true})
  }

  async updateMock(ctx) {
    let serverName =ctx.query.serverName
    console.log(serverName)
    if(!serverName) {
      return ctx.body = yapi.commons.resReturn(null, 400, 'serverName不能为空');
    }
    function managerUpdate() {
      return new Promise(resolve => {
        axios({
           url: 'http://192.168.90.62:5346/manager/update',
           method: 'get',
          params: {
           serverName: serverName
          },
          timeout: 0
       }).then(res => {
         resolve(res.data)
         console.log(res.data)
           
       }).catch(err => {
           console.log(err)
       })
      })
    }
   let result =  await managerUpdate()
   if (result.status) {
    ctx.body = yapi.commons.resReturn({success: true});
   } else {
     ctx.body = yapi.commons.resReturn(null, 400, '失败');
   }
  }
}

module.exports = socketMockController;