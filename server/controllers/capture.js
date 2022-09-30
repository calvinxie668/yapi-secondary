const baseController = require('./base.js');
const yapi = require('../yapi.js');
const captureModel = require('../models/capture.js');
const userModel = require('../models/user.js');
const axios = require('axios');

class captureController extends baseController {
    constructor(ctx) {
        super(ctx);
        this.Model = yapi.getInst(captureModel);
    }
    /**
     * 新增抓包服务
     */
    async add (ctx) {
        const params = ctx.request.body;
        if(!params.intranet) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '内网域名不能为空'));
        }        
        if(!params.extranet) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '外网域名不能为空'));
        }        
        if(!params.remark) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '备注不能为空'));
        }        
        let data = {
            name: params.name,
            intranet: params.intranet,
            extranet: params.extranet,
            remark: params.remark,
            port: params.port || 6699,//端口号默认6699
            env: params.env,
            uid: this.getUid(),
            add_time: yapi.commons.time(),
            up_time: yapi.commons.time()
        }
        let result = await this.Model.save(data);
        ctx.body =  yapi.commons.resReturn(result);
    }

    /**
     * 抓包服务列表
     * @param {*} ctx 
     */
    async list (ctx) {
        const { page, limit } = ctx.request.query;
        if(!page || !limit) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '参数错误'));
        }
        try {
            let list = await this.Model.listWithPage(page, limit);
            let count = await this.Model.listCount();
            const userInst = yapi.getInst(userModel);
            list = JSON.parse(JSON.stringify(list));
            for(let i = 0; i < list.length; i++) {
                let item = list[i]
                if(item.uid) {
                    const userinfo  = await userInst.findById(item.uid)
                    list[i].username = userinfo.username
                }
            }
            return (ctx.body = yapi.commons.resReturn({
                count: count,
                total: Math.ceil(count/limit),
                list: list
              }));
            
        } catch (e) {
            return (ctx.body = yapi.commons.resReturn(null, 402, e.message));
        }
    }
    /**
     * 修改服务数据
     */
    async up (ctx) {
        let params = ctx.params;
        if(!params.id) return ctx.body = yapi.commons.resReturn(null, 400, 'id不能为空');
        let result = await this.Model.up(params.id, params);
        ctx.body = yapi.commons.resReturn(result);
    }

    /**
     * 删除服务
     */
    async del (ctx) {
        let params = ctx.params;
        if(!params.id) return ctx.body = yapi.commons.resReturn(null, 400, 'id不能为空');
        let result = await this.Model.del(params.id);
        ctx.body = yapi.commons.resReturn(result);
		}
	/**
	 * 获取java提供的socket服务列表
	 * @param {*} ctx 
	 */
	async getCaptureList(ctx) {
    function getCaptureListByJava() {
      return new Promise(resolve => {
        axios({
          url: 'http://192.168.91.28:2536/wireshark/server/list',
          method: 'get',
          timeout: 0
       }).then(res => {
         resolve(res.data)
           
       }).catch(err => {
           console.log(err)
       })
      })
    }
   let result =  await getCaptureListByJava()
   if (result.success) {
    ctx.body = yapi.commons.resReturn(result);
   } else {
     ctx.body = yapi.commons.resReturn(null, 400, '失败');
   }
	}
	/**
	 * 通过调用java接口获取当前用户连接的ip
	 * @param {*} ctx 
	 */
	async findConnectIp(ctx) {
		const params = ctx.params 
		console.log(params)
    function findCaptureConnnetIp() {
      return new Promise(resolve => {
        axios({
          url: 'http://192.168.91.28:2536/wireshark/server/find',
					method: 'get',
					params,
          timeout: 0
				}).then(res => {
         resolve(res.data)
           
       }).catch(err => {
           console.log(err)
       })
      })
		}
		try {
			let result = await findCaptureConnnetIp()
			ctx.body = yapi.commons.resReturn(result);
		} catch (e) {
			  ctx.body = yapi.commons.resReturn(null, 400, e.message);
		}
	}
	


}

module.exports = captureController;