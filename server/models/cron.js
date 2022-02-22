const baseModel = require('./base.js');
const yapi = require('../yapi.js');

class cronModel extends baseModel {
    getName() {
      return 'cron';
    }

    getSchema() {
      return {
        uid: { type: Number, required: true },
        project_id: { type: Number, require: true },
        name: { type: String, require: true },
				push_interface: Array,
        status: String,
        push_switch_status: {type: Boolean, default: false},
        times: Number,
        minute: Number,
        stock_codes: String,
        add_time: Number,
        up_time: Number,
        switch_loading: {type: Boolean, default: false},
      }
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

    listWithPage(project_id, page, limit) {
        page = parseInt(page);
        limit = parseInt(limit);
        return this.model
          .find({
						project_id: project_id,
          })
          .skip((page - 1) * limit)
          .limit(limit)
          .exec();
    }

    listCount(option) {
      return this.model.countDocuments(option);
    }

    del(id) {
        return this.model.remove({
          _id: id
        });
    }

    delByProjectId(id) {
        return this.model.remove({
          project_id: id
        });
    }

    delBySocketId(id) {
        return this.model.remove({
          socket_id: id
        });
    }
    
    delByCatid(id) {
      return this.model.remove({
        catid: id
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
    
}

module.exports = cronModel;