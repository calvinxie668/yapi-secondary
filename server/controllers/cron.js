const baseController = require('./base.js');
const yapi = require('../yapi.js');
const cronModel = require('../models/cron.js');
const projectModel = require('../models/project.js');
const socketModel = require('../models/socket.js');

class cronController extends baseController {
    constructor(ctx) {
        super(ctx);
        this.Model = yapi.getInst(cronModel);
        this.projectModel = yapi.getInst(projectModel);
        this.socketModel = yapi.getInst(socketModel);
    }

    async add(ctx) {
        let params = ctx.request.body;
        params = yapi.commons.handleParams(params, {
            project_id: 'number'
        });
      
        if(!params.project_id) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
        }
        if(!params.socket_id) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空'));
        }
        const project = await this.projectModel.get(params.project_id);
        if(!project) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '项目不存在'));
        }
        const socket = await this.socketModel.get(params.socket_id);
        if(!socket) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '接口不存在'))
        }
        if(socket.method.toUpperCase() !== 'PUSH') {
            return (ctx.body = yapi.commons.resReturn(null, 400, '接口类型不是push'))
        }
        const catResult = await this.socketModel.get(params.socket_id);
        let result = await this.Model.save({
            name: params.name,
            project_id: params.project_id,
            socket_id: params.socket_id,
            catid: catResult.catid,
            stock_codes: params.stock_codes,
            status: 0,
            times: params.times,
            minute: params.minute,
            uid: this.getUid(),
            add_time: yapi.commons.time(),
            up_time: yapi.commons.time()
          });
    
          let username = this.getUsername();
          yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 创建了定时任务`,
            type: 'project',
            uid: this.getUid(),
            username: username,
            typeid: params.project_id
          });
    
          ctx.body = yapi.commons.resReturn(result);
    }

    async list(ctx) {
        let socket_id = ctx.params.socket_id;
        const {page, limit} = ctx.request.query;
        if(!socket_id) {
            return ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空');
        }
        if(!page || !limit) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '参数错误'));
        }
        
        const result = await Promise.all([this.Model.listCount(),  this.Model.listWithPage(socket_id, page, limit)])

        ctx.body = yapi.commons.resReturn({
            total: result[0],
            list: result[1]
        });

    }

    async up(ctx) {
        let params = ctx.params;
        let result = await this.Model.up(params.id, params);
        let username = this.getUsername();
        yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了定时任务`,
            type: 'project',
            uid: this.getUid(),
            username: username,
            typeid: params.project_id
        });
        ctx.body = yapi.commons.resReturn(result);
    }

    async del(ctx) {
        let params = ctx.params;
        let result = await this.Model.del(params.id);
        let username = this.getUsername();
        yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除定时任务`,
            type: 'project',
            uid: this.getUid(),
            username: username,
            typeid: params.project_id
        });
        ctx.body = yapi.commons.resReturn(result);
    }
}

module.exports = cronController;