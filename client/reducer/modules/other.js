//ACTIONS

const WS = 'yapi/capture/WS'
//REDUCER
const initialState = {
    ws: null
}

export default (state = initialState, action) => {
    switch(action.type) {
        case WS: {
            return {
                ...state,
                ws: action.payload
            }
        }
        default: return state
    }
};

export function setWS(instance) {
    return {
        type: WS,
        payload: instance
    }
}

