import CronPush from './cronPush.js';

module.exports = function() {
  this.bindHook('sub_nav', function(app) {
    app.cronPush = {
      name: '定时推送',
      path: '/project/:id/push',
      component: CronPush
    };
  });
};
