const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class socketMockModel extends baseModel {
    constructor() {
        super()
    }
    getName() {
      return 'socketMock';
    }

    getSchema() {
      return {
          req_msg_type: { type: String, require: true },
          res_msg_type: { type: String },
          res_msg_body: { type: String },
          content: { type: String },
          add_time: Number,
          up_time: Number
      };
    }

    save(data) {
      let m = new this.model(data);
      return m.save();
    }

    getByReqMsgType(res_msg_type) {
      return this.model
        .findOne({
          res_msg_type: res_msg_type
        })
        .exec();
    }
}

module.exports = socketMockModel;