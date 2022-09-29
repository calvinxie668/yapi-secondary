import axios from 'axios';

// Actions
const GET_CAPTURE_LIST = 'yapi/capture/GET_CAPTURE_LIST';
const DEL_CAPTURE = 'yapi/capture/DEL_CAPTURE';
const ADD_CAPTURE = 'yapi/capture/ADD_CAPTURE';
const UPDATE_CAPTURE = 'yapi/capture/UPDATE_CAPTURE'

const GET_CAPTURE_LIST_BY_JAVA = 'yapi/capture/GET_CAPTURE_LIST_BY_JAVA'
const FIND_CAPTURE_CONNECT_IP = 'yapi/capture/FIND_CAPTURE_CONNECT_IP'


// Reducer
const initialState = {
	data: null,
	serverList: [],
	connectServer: {}
};

export default (state = initialState, action) => {
  if (action.type === GET_CAPTURE_LIST) {
    return {
      ...state,
      data: action.payload.data.data
    };
  } else if (action.type === GET_CAPTURE_LIST_BY_JAVA) {
    return {
      ...state,
      serverList: action.payload.data
    };
  } else if (action.type === FIND_CAPTURE_CONNECT_IP) {
    return {
      ...state,
      connectServer: action.payload.data
    };
  } else {
    return state;
  }
};

//获取抓包服务列表
export function getCaptureListByJava(page, limit) {
  return {
    type: GET_CAPTURE_LIST_BY_JAVA,
    payload: axios.get('http://192.168.91.28:2536/wireshark/server/list')
  };
}
		
//一个服务有多个节点时查找当前用户连接的节点
export function findCaptureConnnetIp(params) {
  return {
    type: FIND_CAPTURE_CONNECT_IP,
    payload: axios.get('http://192.168.91.28:2536/wireshark/server/find', {
      params
    })
  };
}
		
export function getCaptureList(page, limit) {
  return {
    type: GET_CAPTURE_LIST,
    payload: axios.get('/api/capture/list', {
      params: { page, limit }
    })
  };
}

export function addCapture(param) {
  return {
    type: ADD_CAPTURE,
    payload: axios.post('/api/capture/add', param)
  };
}

export function updateCapture(param) {
  return {
    type: UPDATE_CAPTURE,
    payload: axios.post('/api/capture/up', param)
  };
}

export function delCapture(id) {
  return {
    type: DEL_CAPTURE,
    payload: axios.post('/api/capture/del', { id })
  };
}
