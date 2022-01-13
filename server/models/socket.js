const baseModel = require('./base.js');
const yapi = require('../yapi.js');

class socketModel extends baseModel {
    getName () {
        return 'socket';
    }
    getSchema () {
        return {
            title: { type: String, required: true },
            uid: { type: Number, required: true },
            path: { type: String, required: false },
            method: { type: String, required: true },
            req_msg_type: { type: String, require: true },
            req_msg_body: { type: String, require: true },
            res_msg_type: { type: String, require: true },
            res_msg_body: { type: String, require: true },
            topic_id:  String,
            push_msg_type: String,
            push_msg_body: String,
            project_id: { type: Number, required: true },
            catid: { type: Number, required: true },
            edit_uid: { type: Number, default: 0 },
            status: { type: String, enum: ['undone', 'done'], default: 'undone' },
            desc: String,
            markdown: String,
            add_time: Number,
            up_time: Number,
            type: { type: String, enum: ['static', 'var'], default: 'static' },
            query_path: {
              path: String,
              params: [
                {
                  name: String,
                  value: String
                }
              ]
            },
            req_query: [
              {
                name: String,
                value: String,
                example: String,
                desc: String,
                required: {
                  type: String,
                  enum: ['1', '0'],
                  default: '1'
                }
              }
            ],
            req_headers: [
              {
                name: String,
                value: String,
                example: String,
                desc: String,
                required: {
                  type: String,
                  enum: ['1', '0'],
                  default: '1'
                }
              }
            ],
            req_params: [
              {
                name: String,
                desc: String,
                example: String
              }
            ],
            req_body_type: {
              type: String,
              enum: ['form', 'json', 'text', 'file', 'raw']
            },
            req_body_is_json_schema: { type: Boolean, default: false },
            req_body_form: [
              {
                name: String,
                type: { type: String, enum: ['text', 'file'] },
                example: String,
                value: String,
                desc: String,
                required: {
                  type: String,
                  enum: ['1', '0'],
                  default: '1'
                }
              }
            ],
            req_body_other: String,
            res_body_type: {
              type: String,
              enum: ['json', 'text', 'xml', 'raw', 'json-schema']
            },
            res_body: String,
            res_body_is_json_schema: { type: Boolean, default: false },
            custom_field_value: String,
            field2: String,
            field3: String,
            api_opened: { type: Boolean, default: false },
            index: { type: Number, default: 0 },
            tag: Array
          };
    }
    
    save(data) {
        let m = new this.model(data);
        return m.save();
    }

    get(id) {
        return this.model
          .findOne({
            _id: id
          })
          .exec();
    }

    checkRepeat(id, path, method) {
        return this.model.countDocuments({
          project_id: id,
          path: path,
          method: method
        });
    }

    up(id, data) {
        data.up_time = yapi.commons.time();
        return this.model.update(
          {
            _id: id
          },
          data,
          { runValidators: true }
        );
    }
    upEditUid(id, uid) {
        return this.model.update(
          {
            _id: id
          },
          { edit_uid: uid },
          { runValidators: true }
        );
      }

    del(id) {
        return this.model.remove({
          _id: id
        });
      }
    
    delByCatid(id) {
        return this.model.remove({
          catid: id
        });
    }
    
    delByProjectId(id) {
        return this.model.remove({
          project_id: id
        });
    }

    listByCatid(catid, select) {
        select =
          select || `_id title uid path method project_id catid edit_uid status add_time up_time index tag req_msg_type req_msg_body res_msg_type res_msg_body topic_id push_msg_type
          push_msg_type push_msg_body`;
        return this.model
          .find({
            catid: catid
          })
          .select(select)
          .sort({ index: 1 })
          .exec();
      }

      list(project_id, select) {
        select =
          select || '_id title uid path method project_id catid edit_uid status add_time up_time';
        return this.model
          .find({
            project_id: project_id
          })
          .select(select)
          .sort({ title: 1 })
          .exec();
      }  

      listCount(option) {
        return this.model.countDocuments(option);
      }

      listByOptionWithPage(option, page, limit) {
        page = parseInt(page);
        limit = parseInt(limit);
        return this.model
          .find(option)
          .sort({index: 1})
          .skip((page - 1) * limit)
          .limit(limit)
          .select(
            '_id title uid path method project_id catid edit_uid api_opened status add_time up_time index tag'
          )
          .exec();
      }
      
      listByReqMsgType(req_msg_type) {
        return this.model
          .findOne({
            req_msg_type: req_msg_type
          })
          .exec();
      }
/**
 * 
 * @param {*} method 接口类型 pull 、push
 * @returns 
 */
      topicIdList (method) {
        return this.model.find({
          method
        })
        .select('topic_id push_msg_type')
        .exec();
      }
}

module.exports = socketModel