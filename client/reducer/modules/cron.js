import axios from 'axios';

// Actions
const GET_CRON_LIST = 'yapi/cron/GET_CRON_LIST';
const DEL_CRON = 'yapi/cron/DEL_CRON';
const ADD_CRON = 'yapi/cron/ADD_CRON';
const UPDATE_CRON = 'yapi/cron/UPDATE_CRON'

// Reducer
const initialState = {
  data: []
};

export default (state = initialState, action) => {
  if (action.type === GET_CRON_LIST) {
    return {
      ...state,
      data: action.payload.data.data
    };
  } else {
    return state;
  }
};

// 获取定时任务列表
export function getCronList(socket_id, page, limit) {
  return {
    type: GET_CRON_LIST,
    payload: axios.get('/api/cron/list', {
      params: { socket_id, page, limit }
    })
  };
}

// 添加定时任务
export function addCron(param) {
  return {
    type: ADD_CRON,
    payload: axios.post('/api/cron/add', param)
  };
}

// 更新定时任务
export function updateCron(param) {
  return {
    type: UPDATE_CRON,
    payload: axios.post('/api/cron/up', param)
  };
}

// 删除定时任务
export function delCron(id) {
  return {
    type: DEL_CRON,
    payload: axios.post('/api/cron/del', { projectid: id })
  };
}
