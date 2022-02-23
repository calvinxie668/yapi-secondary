import React, { PureComponent as Component, forwardRef, useImperativeHandle, createRef, Fragment } from "react";
import { Button, Tag, Drawer, Row, Col, Divider, Modal, Input, Form, Select, Collapse, Radio, message, Icon } from 'antd'; 
import {Column, Table, AutoSizer} from 'react-virtualized'
import 'react-virtualized/styles.css';
import ReactJson from 'react-json-view'
import { formatTime } from '../../common.js';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setWS } from '../../reducer/modules/other.js';
import { getCaptureList } from '../../reducer/modules/capture.js';
import { getTopicIdList } from '../../reducer/modules/interface.js';
import RecordWorker from "worker-loader?inline!./CaptureWorker.js";
import momnet from 'moment';
let timer = null;
let ws= null;
const myRecordWorker = new RecordWorker(window.URL.createObjectURL(new Blob([RecordWorker.toString()])));

const Open = () => (
    <svg t="1642581994572" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="71838" width="24" height="24">
        <path d="M446.2592 0.546133c31.402667 0 53.794133 17.954133 58.299733 44.8512v403.592534h31.402667v-354.304c8.942933-26.8288 31.402667-44.782933 58.299733-44.782934 31.402667 0 53.794133 17.954133 58.231467 44.8512v385.570134c9.0112 4.5056 13.448533 9.0112 22.459733 13.448533v-260.096c8.942933-26.8288 26.897067-44.782933 58.299734-44.782933 31.402667 0 53.794133 17.954133 58.299733 44.8512 2.730667 133.256533 3.754667 241.732267 3.208533 325.495466a238.933333 238.933333 0 0 0-221.525333 416.768c-19.114667 4.3008-39.185067 6.5536-59.733333 6.5536a275.933867 275.933867 0 0 1-224.187734-112.093866c-53.794133-53.794133-125.610667-170.3936-215.2448-345.2928-13.448533-22.391467 0-49.288533 22.459734-67.242667a50.517333 50.517333 0 0 1 71.68 8.942933l80.759466 134.485334V188.962133c8.942933-26.897067 31.402667-44.8512 58.299734-44.8512 31.402667 0 53.794133 17.954133 58.299733 44.8512v286.993067c8.942933-4.5056 13.448533-4.5056 22.391467-9.0112V45.397333c8.942933-26.897067 31.402667-44.8512 58.299733-44.8512z" p-id="71839" fill="#8a8a8a"></path>
        <path d="M948.224 754.551467L867.874133 653.312a21.7088 21.7088 0 0 0-34.133333 0l-79.940267 101.239467c-6.212267 7.509333-0.4096 19.0464 9.352534 19.0464h31.470933c-0.887467 59.050667-0.887467 134.007467-104.311467 193.9456-2.6624 1.774933-1.365333 5.7344 1.774934 5.3248 197.973333-30.651733 213.947733-163.293867 214.357333-198.792534h32.836267c9.8304-0.477867 15.1552-12.014933 8.874666-19.524266z m-252.996267 25.258666h-31.5392c0.887467-58.9824 0.887467-134.007467 104.311467-193.877333 2.730667-1.8432 1.365333-5.802667-1.774933-5.393067-197.973333 30.651733-213.947733 163.771733-214.357334 198.8608h-32.836266c-9.762133 0-15.5648 11.537067-9.352534 19.0464l80.349867 101.1712c8.874667 11.127467 25.258667 11.127467 34.133333 0l80.349867-101.1712c5.802667-7.099733 0.477867-18.6368-9.284267-18.6368z" p-id="71840" fill="#8a8a8a">
        </path>
    </svg>
)

const Play = () => (
    <svg t="1642577264410" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4888" width="24" height="24">
        <path d="M893.035 463.821679C839.00765 429.699141 210.584253 28.759328 179.305261 8.854514 139.495634-16.737389 99.686007 17.385148 99.686007 57.194775v909.934329c0 45.496716 42.653172 68.245075 76.775709 48.340262 45.496716-28.435448 676.763657-429.375262 716.573284-454.967165 34.122537-22.748358 34.122537-76.775709 0-96.680522z" fill="#8a8a8a" p-id="4889">
        </path>
    </svg>
)

const Pause = () => (
    <svg t="1642581372378"  viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="49181" width="24" height="24">
        <path d="M309.3 130.7h-70.9c-24.3 0-44 19.7-44 44v674.5c0 24.3 19.7 44 44 44h70.9c24.3 0 44-19.7 44-44V174.7c0-24.3-19.7-44-44-44z m476.3 0h-70.9c-24.3 0-44 19.7-44 44v674.5c0 24.3 19.7 44 44 44h70.9c24.3 0 44-19.7 44-44V174.7c0-24.3-19.7-44-44-44z" p-id="49182" fill="#8a8a8a">
        </path>
    </svg>
)

const Clear = () => (
    <svg t="1642577873885"  viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17302" width="24" height="24">
        <path d="M985.6 960H448l275.2-275.2 275.2-275.2c6.4-6.4 12.8-19.2 19.2-25.6v-6.4-6.4c6.4-19.2 0-44.8-12.8-64 0-6.4-6.4-6.4-12.8-12.8L729.6 32c-12.8-19.2-25.6-25.6-44.8-32h-38.4c-12.8 6.4-25.6 12.8-38.4 25.6L25.6 614.4c-32 32-32 89.6 0 121.6L249.6 960H160c-19.2 0-32 12.8-32 32s12.8 32 32 32h825.6c19.2 0 32-12.8 32-32s-12.8-32-32-32zM377.6 377.6L640 640l-294.4 294.4-262.4-262.4 294.4-294.4z" fill="#8a8a8a" p-id="17303">
        </path>
    </svg>
)
const DescriptionItem = ({ title, content }) => (
    <div
      style={{
        fontSize: 14,
        lineHeight: '22px',
        marginBottom: 7,
        color: 'rgba(0,0,0,0.65)',
      }}
    >
      <p
        style={{
          marginRight: 8,
          display: 'inline-block',
          color: 'rgba(0,0,0,0.85)',
        }}
      >
        {title}:
      </p>
      {content}
    </div>
);

const SelectCaprtureService = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({
        form: props.form,
    }));
    const hideModal = () => {
        props.close();
    }
    const handleSubmit = e => {
        e.preventDefault();
        props.form.validateFieldsAndScroll((err, values) => {
          if (!err) {
            const { memberId } = values;
            
            props.init(memberId);
            hideModal();
          }
        });
    };
    const onSelect = (value) => {
        props.onSelected(value)
    };

    return (
        <Modal
        title="select capture service"
        visible={props.visible}
        onOk={handleSubmit}
        onCancel={hideModal}
        footer={[
            <Button key="back" onClick={hideModal}>
              cancel
            </Button>,
            <Button key="submit" type="primary" disabled={props.wsStatus === 'open'} onClick={handleSubmit}>
              start
            </Button>
          ]}
        >
           <Form>
               <Form.Item label="capture services">
                   {
                       props.form.getFieldDecorator('service', {
                           rules: [
                               {
                                   required: true,
                                   message: 'service is requried'
                               }
                           ]
                       })(
                        <Select onSelect={onSelect} placeholder="please select a service">
                            {
                                props.options.map(item => {
                                   return <Select.Option value={item._id} key={item._id}>{`${item.name}-【${item.remark}】`}</Select.Option>
                                })
                            }
                        </Select>
                       )
                   }
               </Form.Item>
               <Form.Item label="memberId">
               {props.form.getFieldDecorator("memberId", {
                   rules: [{
                    required: true,
                    message: 'memberId is required',
                   },{
                       type: 'number',
                       message: 'memberId expect number type',
                       transform(value) {
                         return Number(value);
                       },
                   }]
               })(<Input placeholder="please enter a memberId" />)}
               </Form.Item>
           </Form>
        </Modal>
    )
});

const CaptureServiceForm =  Form.create()(SelectCaprtureService);
@connect(
    state => ({
      ws: state.other.ws,
      topicIdList: state.inter.topicIdList
    }),
    {
      setWS,
      getCaptureList,
      getTopicIdList
    }
  )
class CaptureContent extends Component {
    static propTypes = {
        setWS: PropTypes.func,
        getCaptureList: PropTypes.func,
        getTopicIdList: PropTypes.func
    };
    constructor(props) {
			super(props);
			this.state = {
					showNewRecordTip: false,
					originData: [],
					visible: false,
					details: {},
					lockReconnect: false,
					modalVisible: false,
					memberId: null,
					curRowIndex: null,
					closeDisabled: true,
					isPlay: true
			}
			this.refreshing = true;
			this.recordTableRef = null;
			this.scrollHandlerTimeout = null;
			this.stopRefreshTimout = null;
			this.lastScrollTop = 0;
			this.stopRefreshTokenScrollTop = null;
			this.wsStatus = null;
			this.dataSource = [];
			this.services = [];
			this.retry = 3; //断线重连
			this.wsUrlData = {};
			this.reconnectTimer = null;
			this.diffTimer = null;
    }

    init = (memberId) => {
        if(!memberId) return;
        if(JSON.stringify(this.wsUrlData) === '{}') return;
        // ws = new WebSocket(`ws://a4edab67387824305b6b2b16ec2ce0ce-28ea69bc91b31528.elb.ap-east-1.amazonaws.com:6699/sandbox/hq-interface-push-pc-daily/module/websocket/hq-watch-push-module?memberId=${memberId}`);
        const wsDomain = this.wsUrlData.extranet;
        const wsPath = this.wsUrlData.name;
        let port = 6699;
        if(!/(\.com|\.net|.cn)$/.test(wsDomain) && this.wsUrlData.port) {
            port = this.wsUrlData.port;
        }
        ws = new WebSocket(`ws://${wsDomain}:${port}/sandbox/${wsPath}/module/websocket/hq-watch-push-module?memberId=${memberId}`);
        ws.onopen = (evt) => {
            console.log('open')
            this.wsStatus = evt.type;
            console.log(evt)
            this.props.setWS(ws);
            this.setState({
                closeDisabled: false,
                isPlay: false
            })
            this.heartBeat();
        };
        ws.onmessage = (evt) => {
            // console.log('message')
            // console.log(evt)
            if(evt.data.indexOf('{') > -1) {
                let data = Object.assign(JSON.parse(evt.data), {origin: evt.origin})
                if(data.type.toUpperCase() === 'PUSH') {
                    this.props.topicIdList.map(item => {
                        if(item.push_msg_type === data.msgType) {
                            data.topicId = item.topic_id
                        }
                    })
                }
                const msg = {
                    type: 'updateSingle',
                    data: data
                };
                myRecordWorker.postMessage(JSON.stringify(msg));
                // 不在state声明无法更新视图
                if(data instanceof Object) {
                    this.setState(prevState =>({
                        originData: [...prevState.originData, data]
                    }))
                }
						}
            // this.transFormData();
        };
        ws.onclose = (evt) => {
          console.log(evt)
					this.wsStatus = evt.type;
					this.heartTimer && clearInterval(this.heartTimer);
					message.info('抓包服务已断开连接')
					this.setState({
							closeDisabled: true,
							isPlay: true
					})
					// this.reconnect();
					console.log('close')
        };
        ws.onerror = (evt) => {
            this.reconnect();
            console.log('error')
            console.log(evt)
        }
    }
// ws 断线重连
    reconnect = () => {
        if(this.state.lockReconnect) return;
        if(this.retry == 0) return this.retry = 3;
        this.setState({
            lockReconnect: true
        });
        this.reconnectTimer && clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.init(this.state.memberId);
            this.setState({
                lockReconnect: false
            })
            this.retry -= 1;
        }, parseInt(Math.random()*2000 + 3000))
    }
// 心跳机制 30s向服务端发送一次心跳 60s超时关闭
    heartBeat = () => {
        this.heartTimer && clearInterval(this.heartTimer);
        // this.serverTimer && clearTimeout(this.serverTimer);
        this.heartTimer = setInterval(() => {
            // 给服务端发送心跳包
            ws.send('HeartBeat');
            // this.serverTimer = setTimeout(() => {
            //     ws.close()
            // }, 60000)
        }, 30000)
    }

    closeConnect = () => {
        ws.close(); 
    }

    handleClearData = () => {
        // // 一键清空数据
        this.setState({
            originData: []
        })
        this.dataSource = [];
        myRecordWorker.postMessage(JSON.stringify({
            type: 'clear'
        }));
    }

    transFormData = () => {
        // const deep_copy_origin_data = JSON.parse(JSON.stringify(this.state.originData));
        const msg = {
            type: 'initRecord',
            data: this.state.originData
        }
        myRecordWorker.postMessage(JSON.stringify(msg));
    }

    onRowClick = ({event, index, rowData}) => {
        event.preventDefault();
				if(this.wsStatus !== 'close') {
					this.stopPanelRefreshing();
				}
        if(rowData != undefined) {
            this.setState({
                curRowIndex: index
            })
            this.setState({
                details: rowData
            })
            this.showDrawer();
        }
}

    rowStyleFormat = (row) => {
        if(row.index < 0) return
        if(this.state.curRowIndex === row.index) {
           return {
            backgroundColor: '#1890ff',
            color: '#fff'
           }
        } 
    }

    noRowsRenderer = () => {
        // 暂无数据占位图
        return (
            <div style={{height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
                <div style={{textAlign: 'center'}}>
                    <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(0 1)" fill="none">
                            <ellipse fill="#F5F5F5" cx="32" cy="33" rx="32" ry="7"></ellipse>
                            <g stroke="#D9D9D9"><path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
                            <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#FAFAFA"></path>
                            </g>
                        </g>
                    </svg>
                    <p>no record</p>
                </div>
            </div>
        )
    } 

    showDrawer = () => {
        this.setState({
            visible: true,
        });
    };
    
    onClose = () => {
        this.setState({
            visible: false,
        });
    };
    startCountTime = (date) => {
        // 超过10分钟自动关闭ws
        if(this.wsStatus === 'open' && !!ws) {
            let diffTime = ''
            timer = setInterval(() =>{
                diffTime = momnet().diff(momnet(date), 'minute');
                if(diffTime > 10) {
                  ws.close();
                  clearInterval(timer)
                }
            }, 1000)
        } 
    }

    loadPrevious = () => {
        console.log('loadprevious')
        // this.stopPanelRefreshing();
        myRecordWorker.postMessage(JSON.stringify({
          type: 'loadMore',
          data: -100
        }));
      }
    
    loadNext = () => {
        console.log('loadnext')
				if(this.wsStatus !== 'close') {
					this.stopPanelRefreshing();
				}
        myRecordWorker.postMessage(JSON.stringify({
            type: 'loadMore',
            data: 100
        }));
    }

    stopPanelRefreshing = () => {
        if(!this.refreshing) return
        this.refreshing = false;
        console.log('stop')
        myRecordWorker.postMessage(JSON.stringify({
            type: 'updateRefreshing',
            refreshing: false
        }));
    }

    resumeFresh = () => {
        if(this.state.curRowIndex != null) {
            this.setState({
                curRowIndex: null
            })
        }
        this.setState({
            "showNewRecordTip": false
        });
        this.refreshing = true;
        myRecordWorker.postMessage(JSON.stringify({
            type: 'updateRefreshing',
            refreshing: true
        }));
    }

    initRecrodPanelWrapperRef = (ref) => {
        this.recordTableRef = ref && ref.querySelector('.ReactVirtualized__Table__Grid');
        // this.recordTableRef = ref && ref.querySelector('.ant-table-body');
        ref && ref.addEventListener('wheel', this.onRecordScroll, { passive: true });
    }
    onRecordScroll = () => {
        this.scrollHandlerTimeout && clearTimeout(this.scrollHandlerTimeout);
        this.scrollHandlerTimeout = setTimeout(() => {
            this.scrollHandler();
        }, 60);
    }
    
    scrollHandler = () => {
       if(!this.recordTableRef) {
          return;
       } 
       const scrollTop = this.recordTableRef.scrollTop;
       if(scrollTop < this.lastScrollTop || this.lastScrollTop === 0) {
         this.loadPrevious();
       } else if(scrollTop >= this.lastScrollTop) {
          this.detectIfToStopRefreshing(scrollTop);
         this.loadNext();
       }
       if(scrollTop >= this.recordTableRef.clientHeight) {
        //下滑刷新视图
        this.forceUpdate();
       }
       this.lastScrollTop = scrollTop;
    }

      // if is scrolling up during refresh, will stop the refresh
    detectIfToStopRefreshing = (currentScrollTop) => {
        if (!this.stopRefreshTokenScrollTop) {
          this.stopRefreshTokenScrollTop = currentScrollTop;
        }
        this.stopRefreshTimout && clearTimeout(this.stopRefreshTimout);
        this.stopRefreshTimout = setTimeout(() => {
            // if the scrollbar is scrolled up more than 50px, stop refreshing
            if ((this.stopRefreshTokenScrollTop - currentScrollTop) > 30) {
								if(this.wsStatus !== 'close') {
									this.stopPanelRefreshing();
								}
                this.stopRefreshTokenScrollTop = null;
            }
        }, 50);
    }

    handleOpenModal = () => {
        this.setState({
            modalVisible: true
        })
    }

    handleCloseModal = () => {
        this.setState({
            modalVisible: false
        })
    }

    initRecord = (memberId) => {
        if(this.state.originData.length) {
            // 开启ws时清空列表数据
            this.handleClearData()
        }
        this.setState({
            memberId
        })
        this.init(memberId)
    }

    onSelected = (value) => {
        this.wsUrlData = this.services.filter(item => item._id === value )[0]
    }

    getOptions = async e => {
        const data = await this.props.getCaptureList(1, 1000);
        this.services = data.payload.data.data.list;
    }

    updateFilter = () => {
        this.props.form.validateFields((err, values) => {
            const msg = {
                type: 'updateQuery',
                filterObj: values
            };
          
            myRecordWorker.postMessage(JSON.stringify(msg));
          // 主动更新因table数据变量在state外声明导致视图不更新
            this.diffTimer && clearTimeout(this.diffTimer);
            this.diffTimer = setTimeout(() => {
              this.forceUpdate();
            }, 1000)
          });
    }
    handleOnSearch = (e) => {
        e.preventDefault();
        this.updateFilter();
    }

    handleReset = () => {
        this.props.form.resetFields();
        this.updateFilter();
    }

    getTopicIdList = async () => {
        await this.props.getTopicIdList({method: 'PUSH'});
    }

    handleVisibilitychange = () => {
        if(document.visibilityState === 'hidden' && window.location.href.indexOf('/capture/content') > -1) {
            // console.log('离开')
            const date = new Date();
            if(timer){
                clearInterval(timer)
            }

            this.startCountTime(date)
        }
        if(document.visibilityState === 'visible') {
            // console.log('回来');
            if(window.location.href.indexOf('/capture/content') > -1) {
                clearInterval(timer)
            }
        }
    }

    componentDidMount() {
        this.getOptions();
        this.getTopicIdList();
        myRecordWorker.onmessage = e => {
            const data = JSON.parse(e.data)
            switch(data.type) {
                case 'updateData': {
                    if(data.shouldUpdateRecord) {
                        const filterRcordList = data.recordList.reverse();
                        // this.setState({
                        //     dataSource: []
                        // })
                        this.dataSource = [];
												let obj = null;

                        filterRcordList.forEach((item) => {
                           if(item.type === 'pull')  {
                               obj = {
                                   start_time: formatTime(item.request.requestTime/1000),
                                   application:  this.wsUrlData.name,
                                   duration: item.costTime,
                                   origin: item.origin,
                                   path: item.request.requestMsgType,
                                   type: item.type,
                                   id: item.id,
                                   originIndex: item.originIndex,
                                   request: item.request,
                                   response: item.response
                                };
                           } else {
                               obj = {
                                    start_time: '--',
                                    application:  this.wsUrlData.name,
                                    origin: item.origin,
                                    path: item.msgType,
                                    type: item.type,
                                    topicId: item.topicId || '--',
                                    id: item.id,
                                    originIndex: item.originIndex,
                                    notify: item.payload,
                                    duration: '--'
                               }
                           }
                            // this.setState(prevState =>({
                            //     dataSource: [...prevState.dataSource, obj]
                            // }))
                            this.dataSource.push(obj);
                        })
                    }
                    break;
                }

                case 'updateTip': {
                    this.setState({
                        'showNewRecordTip': data.data
                    })
                }

                default: {
                    break;
                }
            }
        }
        this.unListen = this.props.history.listen((location, action) => {
            let prevLocation = this.props.location;
            let currLocation = location;
            if(prevLocation.pathname === '/capture/content' && !!ws) {
                ws.close();
            }
        });

        window.addEventListener('visibilitychange', this.handleVisibilitychange);
    }

    componentWillUnmount () {
        window.removeEventListener('visibilitychange', this.handleVisibilitychange);
    }

    render () {
        const formRef = createRef();
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 }
        };
        const { type, application, start_time, duration, origin, path, request, response, topicId, notify, originIndex } = this.state.details
        const pStyle = {
            fontSize: 16,
            color: 'rgba(0,0,0,0.85)',
            lineHeight: '24px',
            display: 'block',
            marginBottom: 16,
        };
        let color;
        if(type === 'pull') {
            color = '#669900'
        } else {
            color = '#FF9933'
        }   
        return (
            <div className="capture-main" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                <Icon component={Open} onClick={this.handleOpenModal} style={{marginRight: '20px'}} title="open"/>
                {this.state.isPlay ? <Icon component={Play} className={!!ws && JSON.stringify(this.wsUrlData) != '{}' ? '' : 'disabled'} title="play" style={{marginRight: '20px'}} onClick={() => this.init(this.state.memberId)}/> 
                : <Icon component={Pause} className={this.state.closeDisabled ? 'disabled': ''} title="pause" style={{marginRight: '20px'}} onClick={this.closeConnect}/>}
                <Icon component={Clear} onClick={this.handleClearData} title="clear" className={!this.dataSource.length? 'disabled': ''}/>
                <Collapse style={{marginTop: '15px'}}>
                    <Collapse.Panel
                        header="Filter"
                    >
                        <Form onSubmit={this.handleOnSearch}>
                            <Row>
                                <Col span={10}>
                                    <Form.Item label="Interface Type" {...formItemLayout}>
                                        {
                                            getFieldDecorator('type', {initialValue: 'all'})
                                            (<Radio.Group>
                                                <Radio value={'all'}>All</Radio>
                                                <Radio value={'pull'}>Pull</Radio>
                                                <Radio value={'push'}>Push</Radio>
                                              </Radio.Group>)
                                        }
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={10}>
                                    <Form.Item label="RequestMsgType/TopicId" {...formItemLayout}>
                                        {
                                           getFieldDecorator('requestMsgType')
                                           (<Input placeholder="RequestMsgType/TopicId"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item label="ResponseMsgType/msgType" {...formItemLayout}>
                                        {
                                           getFieldDecorator('responseMsgType')
                                           (<Input placeholder="ResponseMsgType/msgType"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24} type="flex" justify="start">
                                <Col span={10}>
                                    <Form.Item label="custom message content" {...formItemLayout}>
                                        {
                                           getFieldDecorator('key1')
                                           (<Input placeholder="消息内容任意值可支持正则"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item>
                                        {
                                           getFieldDecorator('key2')
                                           (<Input placeholder="消息内容任意值可支持正则"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item>
                                        {
                                           getFieldDecorator('key3')
                                           (<Input placeholder="消息内容任意值可支持正则"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24} style={{ textAlign: 'center' }}>
                                    <Button type="primary" htmlType="submit">
                                        Search
                                        </Button>
                                    <Button style={{ marginLeft: 8 }} onClick={this.handleReset}>
                                        Clear
                                    </Button>  
                                </Col>
                            </Row>
                        </Form>

                       
                    </Collapse.Panel>
                </Collapse>
                <div style={{marginTop: '15px'}} className="tableWarpper" ref={this.initRecrodPanelWrapperRef}>
                    <AutoSizer disableHeight>
                    {({ width, height }) => (
                        <Table 
                            width={width}
                            height={600}
                            headerHeight={20}
                            headerStyle={{background: '#eee', marginRight: 0, borderRight: '1px solid #fff', height: '25px', lineHeight: '25px'}}
                            rowHeight={30}
                            className="table-custom"
                            rowClassName="row-custom"
                            onRowClick={this.onRowClick}
                            rowStyle={this.rowStyleFormat}
                            rowCount={this.dataSource.length}
                            rowGetter={({index}) => this.dataSource[index]}
                            noRowsRenderer={this.noRowsRenderer}>
                            <Column label="Application" dataKey="application"  width={120} flexGrow={1}
                                cellRenderer={({rowData, rowIndex}) => {
                                    if(rowData == undefined) return (<span></span>) //hack 下拉滚动条会触发react-virtualized table组件下defaultCellDataGetter.js 文件 代码报错
                                    let color;
                                    if(rowData.type === 'pull') {
                                        color = '#669900'
                                    } else {
                                        color = '#FF9933'
                                    }
                                    return (
                                        <span title={rowData.id}>
                                            <span style={{paddingRight: '5px'}}>{rowData.originIndex}</span>
                                            <Tag  color={color} key={rowData.type}>
                                                {rowData.type}
                                            </Tag>
                                            <span>{rowData.application}</span>
                                        </span>
                                    )
                                }}
                            ></Column>
                            <Column label="Origin" dataKey="origin"  width={220}></Column>
                            <Column label="Path" dataKey="path"  width={240} flexGrow={1}></Column>
                            <Column label="Start" dataKey="start_time"  width={160}></Column>
                            <Column label="Duration" dataKey="duration"  width={120} cellRenderer={({rowData}) => {
                              if(rowData == undefined) return (<span></span>)  //hack 下拉滚动条会触发react-virtualized table组件下defaultCellDataGetter.js 文件 代码报错
                              return (<span>{type === 'pull' ? rowData.duration + 'ms' : '--'}</span>)   
                            }}></Column>
                        </Table>
                    )}
                    </AutoSizer>
                    {this.state.showNewRecordTip && <div onClick={this.resumeFresh} className="detected"><span className="detected-name">New Records Detected.<span className="arrowDown"></span></span></div>}
                </div>
                {this.state.visible &&
                <Drawer
                    title={<span style={{paddingRight: '5px'}}>{originIndex}<Tag color={color} key={type}>{type}</Tag>{application}</span>}
                    placement="right"
                    width={760}
                    onClose={this.onClose}
                    visible={this.state.visible}
                    >
                    <p style={{ ...pStyle }}>Interface Infos</p>
                    <Row>
                        <Col span={24}>
                            <DescriptionItem title="Application" content={application}/>
                        </Col>
                    </Row>           
                    <Row>
                        <Col span={24}>
                            <DescriptionItem title="Origin" content={origin}/>
                        </Col>
                    </Row>           
                    <Row>
                        <Col span={24}>
                            <DescriptionItem title="Path" content={path}/>
                        </Col>
                    </Row>           
                    {type ==='push' && <Row>
                        <Col span={24}>
                            <DescriptionItem title="topicId" content={topicId}/>
                        </Col>
                    </Row>}           
                    <Row>
                        <Col span={24}>
                            <DescriptionItem title="Type" content={type}/>
                        </Col>
                    </Row>           
                    <Row>
                        <Col span={24}>
                            <DescriptionItem title="StartTime" content={start_time}/>
                        </Col>
                    </Row>           
                    <Row>
                        <Col span={24}>
                            <DescriptionItem title="Duration" content={type === 'pull' ? duration + 'ms' : '--'}/>
                        </Col>
                    </Row>  
                    <Divider />  
                    {
                        type === 'pull' ?<Fragment>
                            <p style={{ ...pStyle }}>Request</p>     
                    <Row>
                        <Col span={24}>
                            <ReactJson src={request} />
                        </Col>
                    </Row>  
                    <Divider />  
                    <p style={{ ...pStyle }}>Response</p> 
                    <Row>
                        <Col span={24}>
                            <ReactJson src={response} />
                        </Col>
                    </Row>  
                        </Fragment> 
                    :   <Fragment>
                        <p style={{ ...pStyle }}>Notify</p> 
                    <Row>
                        <Col span={24}>
                            <ReactJson src={notify} />
                        </Col>
                    </Row>
                    </Fragment> 
                    }
                </Drawer>}
                {this.state.modalVisible && 
                <CaptureServiceForm 
                    visible={this.state.modalVisible} 
                    close={this.handleCloseModal} 
                    wrappedComponentRef={formRef} 
                    init={this.initRecord}
                    options={this.services}
                    onSelected={this.onSelected}
                    wsStatus={this.wsStatus}>
                </CaptureServiceForm>}
            </div>
        )
    }
}

export default Form.create()(CaptureContent);
