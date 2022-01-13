import axios from 'axios';

// Actions
const GET_CAPTURE_LIST = 'yapi/capture/GET_CAPTURE_LIST';
const DEL_CAPTURE = 'yapi/capture/DEL_CAPTURE';
const ADD_CAPTURE = 'yapi/capture/ADD_CAPTURE';
const UPDATE_CAPTURE = 'yapi/capture/UPDATE_CAPTURE'


// Reducer
const initialState = {
  data: null,
};

export default (state = initialState, action) => {
  if (action.type === GET_CAPTURE_LIST) {
    return {
      ...state,
      data: action.payload.data.data
    };
  } else {
    return state;
  }
};

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
