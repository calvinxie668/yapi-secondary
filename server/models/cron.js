const baseModel = require('./base.js');
const yapi = require('../yapi.js');

class cronModel extends baseModel {
    getName() {
      return 'cron';
    }

    getSchema() {
      return {
        uid: { type: Number, required: true, ref: 'user'},
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

    listWithPage(project_id, page, limit, keyword) {
			// 分页查询、支持名称、股票代码模糊查询
        page = parseInt(page);
        limit = parseInt(limit);
        return this.model
				.aggregate([{
					$lookup: {
						from: 'user',
						let: { uid: "$uid"},
						as: "user_name",
						pipeline: [{
							$match: {
								$expr: { $eq: ["$_id", "$$uid"] },
							}
						},
						{
							$project: {  'username': 1 }
						}]
					}
				},
				{
					$replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$user_name", 0 ] }, "$$ROOT" ] } }
				},
				{ $project: { user_name: 0 } },
				{
					$match: {
						project_id: parseInt(project_id),
						$or: [
							{name: new RegExp(keyword, "i")},
							{stock_codes: new RegExp(keyword, "i")}
						]
					}
				}
			])
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();
    }

		// 高级筛选
		listFilter(project_id, page, limit, keyword={}) {
			page = parseInt(page);
			limit = parseInt(limit);
			const { name, stock_codes, uid, add_time, status } = keyword
			return this.model
				// .find({
				// 	project_id: project_id,
				// 	name: nameRegx,
				// 	stock_codes: stockCodesRegx
				// })
				// .populate({path: 'uid', select: 'username _id'})
				.aggregate([{
					$lookup: {
						from: 'user',
						// localField: "uid",
						// foreignField: "_id",
						let: { uid: "$uid"},
						as: "user_name",
						pipeline: [{
							$match: {
								$expr: { $eq: ["$_id", "$$uid"] },
							}
						},
						{
							$project: {  'username': 1 }
						}]
					}
				},
				{
					$replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$user_name", 0 ] }, "$$ROOT" ] } }
				},
				{ $project: { user_name: 0 } },
				{
					$match: {
						project_id: parseInt(project_id),
						$and: [
							{name: new RegExp(name, "i")},
							{stock_codes: new RegExp(stock_codes, "i")},
							uid != undefined ? {uid: parseInt(uid)} : {},
							add_time != undefined && Array.isArray(add_time) && add_time.length != 0 ? {add_time: { $gte: Number(add_time[0]), $lte: Number(add_time[1])}} : {},
							status != undefined ? { status: status + '' }: {}
						]
					}
				},
			])
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