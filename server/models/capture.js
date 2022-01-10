const baseModel = require('./base.js');
const yapi = require('../yapi.js');

class captureModel extends baseModel {

    getName() {
        return 'capture';
    }    

    getSchema () {
        return {
            uid: { type: Number, required: true },
            name: String,
            intranet: { type: String, required: true },//内网域名
            extranet: { type: String, required: true },//外网域名
            env: Number,
            remark: { type: String, required: true },
            add_time: Number,
            up_time: Number
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

    listCount(option) {
        return this.model.countDocuments(option);
    }

    listWithPage(page, limit) {
        page = parseInt(page);
        limit = parseInt(limit);
        return this.model
          .find()
          .skip((page - 1) * limit)
          .limit(limit)
          .exec();
    }

    del(id) {
        return this.model.remove({
          _id: id
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

module.exports = captureModel;
