const baseModel = require('./base.js');
const yapi = require('../yapi.js');

class socketCat extends baseModel {
    getName() {
        return 'socket_cat';
    }

    getSchema() {
        return {
            name: { type: String, require: true },
            uid: { type: Number, require: true },
            project_id: { type: Number, require: true },
            desc: String,
            add_time: Number,
            up_time: Number,
            index: { type: Number, default: 0 }
        };
    }

    save(data) {
        let m = new this.model(data)
        return m.save()
    }

    list(project_id) {
        return this.model
        .find({
            project_id: project_id
        })
        .sort({ index: 1 })
        .exec()
    }

    get(id) {
      return this.model
        .findOne({
        _id: id
        })
        .exec();
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

    up(id, data) {
        data.up_time = yapi.commons.time();
        return this.model.update(
            {
            _id: id
            },
            data
        );
    }

    upCatIndex(id, index) {
        return this.model.update(
            {
            _id: id
            },
            {
            index: index
            }
        );
    }
}

module.exports = socketCat