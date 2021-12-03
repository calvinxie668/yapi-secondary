const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class socketOncePush extends baseModel {
    constructor() {
        super()
    }
    getName() {
      return 'socketOncePush';
    }

    getSchema() {
      return {
          socket_id: {type: Number, require: true},
          stock_codes_single: {type: String, require: true},
          content: { type: String },
          add_time: Number,
          up_time: Number
      };
    }

    save(data) {
      let m = new this.model(data);
      return m.save();
    }
    
    listBySocketId(id) {
      return this.model.findOne(
        {
          socket_id: id
        }
      )
      .exec()
    }   

    up(id, data) {
      data.up_time = yapi.commons.time();
      return this.model.update(
          {
            socket_id: id
          },
          data,
          { runValidators: true }
      );
    }
}

module.exports = socketOncePush;