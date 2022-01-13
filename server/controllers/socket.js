const socketModel = require('../models/socket.js');
const socketCatModel = require('../models/socketCat.js');
const projectModel  =  require('../models/project.js');
const baseController = require('./base.js');
const cronModel = require('../models/cron.js')
const _ = require('underscore');
const url = require('url');
const yapi = require('../yapi.js')
const userModel = require('../models/user.js');
const showDiffMsg = require('../../common/diff-view.js');
const jsondiffpatch = require('jsondiffpatch');
const formattersHtml = jsondiffpatch.formatters.html;
const fs = require('fs-extra');
const path = require('path');


class socketController extends baseController {
    constructor(ctx) {
        super(ctx);
        this.Model = yapi.getInst(socketModel);
        this.catModel = yapi.getInst(socketCatModel);
        this.projectModel = yapi.getInst(projectModel);
        this.userModel = yapi.getInst(userModel);
    }

    async listByMenu(ctx) {
        let project_id = ctx.params.project_id;
        if(!project_id) {
            return ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空');
        }

        let project = await this.projectModel.getBaseInfo(project_id);
        if(!project) {
            return ctx.body = yapi.commons.resReturn(null, 406, '不存在的项目');
        }
        if(project.project_type === 'private') {
            const auth = await this.checkAuth(project._id, 'project', 'view')
            if(!auth) {
               return ctx.body = yapi.commons.resReturn(null, 406, '没有权限');     
            }
        }
        try {
            let result = await this.catModel.list(project_id),
            newResult = []
            for (let i = 0, item, list; i < result.length; i++) {
              item = result[i].toObject();
              list = await this.Model.listByCatid(item._id);
              for (let j = 0; j < list.length; j++) {
                list[j] = list[j].toObject();
              }
      
              item.list = list;
              newResult[i] = item;
            }
            ctx.body = yapi.commons.resReturn(newResult);
        } catch (err) {
            ctx.body = yapi.commons.resReturn(null, 402, err.message);
        }
    }

    async addCat(ctx) {
        try {
          let params = ctx.request.body;
          params = yapi.commons.handleParams(params, {
            name: 'string',
            project_id: 'number',
            desc: 'string'
          });
    
          if (!params.project_id) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
          }
          if (!this.$tokenAuth) {
            let auth = await this.checkAuth(params.project_id, 'project', 'edit');
            if (!auth) {
              return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
            }
          }
    
          if (!params.name) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '名称不能为空'));
          }
    
          let result = await this.catModel.save({
            name: params.name,
            project_id: params.project_id,
            desc: params.desc,
            uid: this.getUid(),
            add_time: yapi.commons.time(),
            up_time: yapi.commons.time()
          });
    
          let username = this.getUsername();
          yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 添加了分类  <a href="/project/${
              params.project_id
            }/socket/api/cat_${result._id}">${params.name}</a>`,
            type: 'project',
            uid: this.getUid(),
            username: username,
            typeid: params.project_id
          });
    
          ctx.body = yapi.commons.resReturn(result);
        } catch (e) {
          ctx.body = yapi.commons.resReturn(null, 402, e.message);
        }
    }

    async upCat(ctx) {
      try {
        let params = ctx.request.body;
  
        let username = this.getUsername();
        let cate = await this.catModel.get(params.catid);
  
        let auth = await this.checkAuth(cate.project_id, 'project', 'edit');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
  
        let result = await this.catModel.up(params.catid, {
          name: params.name,
          desc: params.desc,
          up_time: yapi.commons.time()
        });
  
        yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了分类 <a href="/project/${
            cate.project_id
          }/socket/api/cat_${params.catid}">${cate.name}</a>`,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: cate.project_id
        });
  
        ctx.body = yapi.commons.resReturn(result);
      } catch (e) {
        ctx.body = yapi.commons.resReturn(null, 400, e.message);
      }
    }

    async delCat(ctx) {
    try {
      let id = ctx.request.body.catid;
      let catData = await this.catModel.get(id);
      if (!catData) {
        ctx.body = yapi.commons.resReturn(null, 400, '不存在的分类');
      }

      if (catData.uid !== this.getUid()) {
        let auth = await this.checkAuth(catData.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }

      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了分类 "${
          catData.name
        }" 及该分类下的接口`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: catData.project_id
      });

      await this.catModel.del(id);
      let r = await this.Model.delByCatid(id);
      let cronInst = yapi.getInst(cronModel);
      await cronInst.delByCatid(id);
      
      return (ctx.body = yapi.commons.resReturn(r));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

    /** 
     * 添加接口
     */
    async add(ctx) {
      let params = ctx.params;

      if (!this.$tokenAuth) {
        let auth = await this.checkAuth(params.project_id, 'project', 'edit');
  
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 40033, '没有权限'));
        }
      }

      params.method = (params.method || 'PULL').toUpperCase();
      params.res_body_is_json_schema = _.isUndefined(params.res_body_is_json_schema)
      ? false
      : params.res_body_is_json_schema;
    params.req_body_is_json_schema = _.isUndefined(params.req_body_is_json_schema)
      ? false
      : params.req_body_is_json_schema;
    params.method = params.method.toUpperCase();
    params.req_params = params.req_params || [];
    params.res_body_type = params.res_body_type ? params.res_body_type.toLowerCase() : 'json';
    // params.path = params.method === 'PULL' ? params.req_msg_type : params.push_msg_type;
      
      let checkRepeat = await this.Model.checkRepeat(params.project_id, params.path, params.method);

      if (checkRepeat > 0) {
        return (ctx.body = yapi.commons.resReturn(
          null,
          40022,
          '已存在的接口:' + params.path + '[' + params.method + ']'
        ));
      }
      if(params._id) {
        delete params._id
      }
      let data = Object.assign(params, {
        uid: this.getUid(),
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time()
      })
      // 新建接口的人成为项目dev  如果不存在的话
      // 命令行导入时无法获知导入接口人的信息，其uid 为 999999
      let uid = this.getUid();
      if (this.getRole() !== 'admin' && uid !== 999999) {
        let userdata = await yapi.commons.getUserdata(uid, 'dev');
        // 检查一下是否有这个人
        let check = await this.projectModel.checkMemberRepeat(params.project_id, uid);
        if (check === 0 && userdata) {
          await this.projectModel.addMember(params.project_id, [userdata]);
        }
      }
      let result = await this.Model.save(data);
      this.catModel.get(params.catid).then(cate => {
        let username = this.getUsername();
        let title = `<a href="/user/profile/${this.getUid()}">${username}</a> 为分类 <a href="/project/${
          params.project_id
        }/socket/api/cat_${params.catid}">${cate.name}</a> 添加了接口 <a href="/project/${
          params.project_id
        }/socket/api/${result._id}">${data.title}</a> `;
  
        yapi.commons.saveLog({
          content: title,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: params.project_id
        });
        this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();
      });
      ctx.body = yapi.commons.resReturn(result);
    }

  /**
   * 接口列表
   * @interface /socket/list
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @param {Number}   page 当前页
   * @param {Number}   limit 每一页限制条数
   * @returns {Object}
   * @example ./api/socket/list.json
   */
   async list(ctx) {
    let project_id = ctx.params.project_id;
    let page = ctx.request.query.page || 1,
      limit = ctx.request.query.limit || 10;
    let status = ctx.request.query.status,
      tag = ctx.request.query.tag;
    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 407, '不存在的项目'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
      }
    }
    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }

    try {
      let result, count;
      if (limit === 'all') {
        result = await this.Model.list(project_id);
        count = await this.Model.listCount({project_id});
      } else {
        let option = {project_id};
        if (status) {
          if (Array.isArray(status)) {
            option.status = {"$in": status};
          } else {
            option.status = status;
          }
        }
        if (tag) {
          if (Array.isArray(tag)) {
            option.tag = {"$in": tag};
          } else {
            option.tag = tag;
          }
        }

        result = await this.Model.listByOptionWithPage(option, page, limit);
        count = await this.Model.listCount(option);
      }


      ctx.body = yapi.commons.resReturn({
        count: count,
        total: Math.ceil(count / limit),
        list: result
      });
      // yapi.emitHook('interface_list', result).then();
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }

    async get(ctx) {
      const params = ctx.params;
      if(!params.id) {
        return ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空')
      }

      try {
        let result = await this.Model.get(params.id);
        if (!result) {
          return (ctx.body = yapi.commons.resReturn(null, 490, '不存在的'));
        }
        let userinfo = await this.userModel.findById(result.uid);
        let project = await this.projectModel.getBaseInfo(result.project_id);
        if (project.project_type === 'private') {
          if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
          }
        }
        // yapi.emitHook('interface_get', result).then();
        result = result.toObject();
        if (userinfo) {
          result.username = userinfo.username;
        }
        ctx.body = yapi.commons.resReturn(result);
      } catch (e) {
        ctx.body = yapi.commons.resReturn(null, 402, e.message);
      }

    } 

    async listByCat(ctx) {
      let catid = ctx.request.query.catid;
      let page = ctx.request.query.page || 1,
        limit = ctx.request.query.limit || 10;
      let status = ctx.request.query.status,
        tag = ctx.request.query.tag;
  
      if (!catid) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'catid不能为空'));
      }
      try {
        let catdata = await this.catModel.get(catid);
  
        let project = await this.projectModel.getBaseInfo(catdata.project_id);
        if (project.project_type === 'private') {
          if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
          }
        }
  
  
        let option = {catid}
        if (status) {
          if (Array.isArray(status)) {
            option.status = {"$in": status};
          } else {
            option.status = status;
          }
        }
        if (tag) {
          if (Array.isArray(tag)) {
            option.tag = {"$in": tag};
          } else {
            option.tag = tag;
          }
        }
  
        let result = await this.Model.listByOptionWithPage(option, page, limit);
  
        let count = await this.Model.listCount(option);
  
        ctx.body = yapi.commons.resReturn({
          count: count,
          total: Math.ceil(count / limit),
          list: result
        });
      } catch (err) {
        ctx.body = yapi.commons.resReturn(null, 402, err.message + '1');
      }
    }


  /**
   * 编辑接口
   * @interface /socket/up
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 接口id，不能为空
   * @param {String}   [path] 接口请求路径
   * @param {String}   [method] 请求方式
   * @param {Array}  [req_headers] 请求的header信息
   * @param {String}  [req_headers[].name] 请求的header信息名
   * @param {String}  [req_headers[].value] 请求的header信息值
   * @param {Boolean}  [req_headers[].required] 是否是必须，默认为否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 请求参数方式，有["form", "json", "text", "xml"]四种
   * @param {Mixed}  [req_body_form] 请求参数,如果请求方式是form，参数是Array数组，其他格式请求参数是字符串
   * @param {String} [req_body_form[].name] 请求参数名
   * @param {String} [req_body_form[].value] 请求参数值，可填写生成规则（mock）。如@email，随机生成一条email
   * @param {String} [req_body_form[].type] 请求参数类型，有["text", "file"]两种
   * @param {String} [req_body_other]  非form类型的请求参数可保存到此字段
   * @param {String}  [res_body_type] 相应信息的数据格式，有["json", "text", "xml"]三种
   * @param {String} [res_body] 响应信息，可填写任意字符串，如果res_body_type是json,则会调用mock功能
   * @param  {String} [desc] 接口描述
   * @returns {Object}
   * @example ./api/interface/up.json
   */
   async up(ctx) {
    let params = ctx.params;

    if (!_.isUndefined(params.method)) {
      params.method = params.method || 'GET';
      params.method = params.method.toUpperCase();
    }

    let id = params.id;
    params.message = params.message || '';
    params.message = params.message.replace(/\n/g, '<br>');
    // params.res_body_is_json_schema = _.isUndefined (params.res_body_is_json_schema) ? true : params.res_body_is_json_schema;
    // params.req_body_is_json_schema = _.isUndefined(params.req_body_is_json_schema) ?  true : params.req_body_is_json_schema;

    // handleHeaders(params)

    let interfaceData = await this.Model.get(id);
    if (!interfaceData) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '不存在的接口'));
    }
    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(interfaceData.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
    }

    let data = Object.assign(
      {
        up_time: yapi.commons.time()
      },
      params
    );

    // if (params.path) {
    //   let http_path;
    //   http_path = url.parse(params.path, true);

    //   if (!yapi.commons.verifyPath(http_path.pathname)) {
    //     return (ctx.body = yapi.commons.resReturn(
    //       null,
    //       400,
    //       'path第一位必需为 /, 只允许由 字母数字-/_:.! 组成'
    //     ));
    //   }
    //   params.query_path = {};
    //   params.query_path.path = http_path.pathname;
    //   params.query_path.params = [];
    //   Object.keys(http_path.query).forEach(item => {
    //     params.query_path.params.push({
    //       name: item,
    //       value: http_path.query[item]
    //     });
    //   });
    //   data.query_path = params.query_path;
    // }

    if (
      params.path &&
      (params.path !== interfaceData.path || params.method !== interfaceData.method)
    ) {
      let checkRepeat = await this.Model.checkRepeat(
        interfaceData.project_id,
        params.path,
        params.method
      );
      if (checkRepeat > 0) {
        return (ctx.body = yapi.commons.resReturn(
          null,
          401,
          '已存在的接口:' + params.path + '[' + params.method + ']'
        ));
      }
    }

    if (!_.isUndefined(data.req_params)) {
      if (Array.isArray(data.req_params) && data.req_params.length > 0) {
        data.type = 'var';
      } else {
        data.type = 'static';
        data.req_params = [];
      }
    }
    let result = await this.Model.up(id, data);
    let username = this.getUsername();
    let CurrentInterfaceData = await this.Model.get(id);
    let logData = {
      interface_id: id,
      cat_id: data.catid,
      current: CurrentInterfaceData.toObject(),
      old: interfaceData.toObject()
    };

    this.catModel.get(interfaceData.catid).then(cate => {
      let diffView2 = showDiffMsg(jsondiffpatch, formattersHtml, logData);
      if (diffView2.length <= 0) {
          return; // 没有变化时，不写日志
      }
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 
                    更新了分类 <a href="/project/${cate.project_id}/socket/api/cat_${
          data.catid
        }">${cate.name}</a> 
                    下的接口 <a href="/project/${cate.project_id}/socket/api/${id}">${
          interfaceData.title
        }</a><p>${params.message}</p>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: cate.project_id,
        data: logData
      });
    });

    this.projectModel.up(interfaceData.project_id, { up_time: new Date().getTime() }).then();
    if (params.switch_notice === true) {
      let diffView = showDiffMsg(jsondiffpatch, formattersHtml, logData);
      let annotatedCss = fs.readFileSync(
        path.resolve(
          yapi.WEBROOT,
          'node_modules/jsondiffpatch/dist/formatters-styles/annotated.css'
        ),
        'utf8'
      );
      let htmlCss = fs.readFileSync(
        path.resolve(yapi.WEBROOT, 'node_modules/jsondiffpatch/dist/formatters-styles/html.css'),
        'utf8'
      );

      let project = await this.projectModel.getBaseInfo(interfaceData.project_id);

      let interfaceUrl = `${ctx.request.origin}/project/${
        interfaceData.project_id
      }/socket/api/${id}`;

      yapi.commons.sendNotice(interfaceData.project_id, {
        title: `${username} 更新了接口`,
        content: `<html>
        <head>
        <style>
        ${annotatedCss}
        ${htmlCss}
        </style>
        </head>
        <body>
        <div><h3>${username}更新了接口(${data.title})</h3>
        <p>项目名：${project.name} </p>
        <p>修改用户: ${username}</p>
        <p>接口名: <a href="${interfaceUrl}">${data.title}</a></p>
        <p>接口路径: [${data.method}]${data.path}</p>
        <p>详细改动日志: ${this.diffHTML(diffView)}</p></div>
        </body>
        </html>`
      });
    }

    yapi.emitHook('interface_update', id).then();
    ctx.body = yapi.commons.resReturn(result);
    return 1;
  }

  diffHTML(html) {
    if (html.length === 0) {
      return `<span style="color: #555">没有改动，该操作未改动Api数据</span>`;
    }

    return html.map(item => {
      return `<div>
      <h4 class="title">${item.title}</h4>
      <div>${item.content}</div>
    </div>`;
    });
  }

    // 处理编辑冲突
    async solveConflict(ctx) {
      try {
        let id = parseInt(ctx.query.id, 10),
          result,
          userInst,
          userinfo,
          data;
        if (!id) {
          return ctx.websocket.send('id 参数有误');
        }
        result = await this.Model.get(id);
  
        if (result.edit_uid !== 0 && result.edit_uid !== this.getUid()) {
          userInst = yapi.getInst(userModel);
          userinfo = await userInst.findById(result.edit_uid);
          data = {
            errno: result.edit_uid,
            data: { uid: result.edit_uid, username: userinfo.username }
          };
        } else {
          this.Model.upEditUid(id, this.getUid()).then();
          data = {
            errno: 0,
            data: result
          };
        }
        ctx.websocket.send(JSON.stringify(data));
        ctx.websocket.on('close', () => {
          this.Model.upEditUid(id, 0).then();
        });
      } catch (err) {
        yapi.commons.log(err, 'error');
      }
    }

      /**
   * 删除接口
   * @interface /socket/del
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 接口id，不能为空
   * @returns {Object}
   * @example ./api/socket/del.json
   */

  async del(ctx) {
    try {
      let id = ctx.request.body.id;

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空'));
      }

      let data = await this.Model.get(id);

      if (data.uid != this.getUid()) {
        let auth = await this.checkAuth(data.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }

      // let inter = await this.Model.get(id);
      let result = await this.Model.del(id);
      let cronInst = yapi.getInst(cronModel);
      await cronInst.delBySocketId(id);
      // yapi.emitHook('interface_del', id).then();
      // await this.caseModel.delByInterfaceId(id);
      let username = this.getUsername();
      this.catModel.get(data.catid).then(cate => {
        yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了分类 <a href="/project/${
            cate.project_id
          }/socket/api/cat_${data.catid}">${cate.name}</a> 下的接口 "${data.title}"`,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: cate.project_id
        });
      });
      this.projectModel.up(data.project_id, { up_time: new Date().getTime() }).then();
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }

  async getTopicIdList(ctx) {
    const params = ctx.params.method;
    try {
     const result =  await this.Model.topicIdList(params);
     ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  } 
}

module.exports = socketController      