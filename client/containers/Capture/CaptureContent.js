import React, { PureComponent as Component, forwardRef, useImperativeHandle, createRef } from "react";
import { Button, Tag, Drawer, Row, Col, Divider, Modal, Input, Form} from 'antd'; 
import {Column, Table, AutoSizer} from 'react-virtualized'
import 'react-virtualized/styles.css';
import ReactJson from 'react-json-view'
import { formatTime } from '../../common.js';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setWS } from '../../reducer/modules/other.js';
import RecordWorker from "worker-loader?inline!./CaptureWorker.js";
import momnet from 'moment';
let timer = null;
let ws= null;

const myRecordWorker = new RecordWorker(window.URL.createObjectURL(new Blob([RecordWorker.toString()])));
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
            </Button>,
          ]}
        >
           <Form>
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
               })(<Input />)}
               </Form.Item>
           </Form>
        </Modal>
    )
});

const CaptureServiceForm =  Form.create()(SelectCaprtureService);
@connect(
    state => ({
      ws: state.other.ws
    }),
    {
      setWS,
    }
  )
class CaptureContent extends Component {
    static propTypes = {
        setWS: PropTypes.func,
    };
    constructor(props) {
        super(props);
        this.state = {
            showNewRecordTip: false,
            originData: [],
            visible: false,
            details: {},
            lockReconnect: false,
            modalVisible: false
        }
        this.refreshing = true;
        this.recordTableRef = null;
        this.scrollHandlerTimeout = null;
        this.stopRefreshTimout = null;
        this.lastScrollTop = 0;
        this.stopRefreshTokenScrollTop = null;
        this.dataSource = [];
        this.wsStatus = null;
    }

    init = (memberId) => {
        if(!memberId) return;
        ws = new WebSocket(`ws://af54ac1647ddb49328a347830dce64aa-1047970568.ap-east-1.elb.amazonaws.com:6699/sandbox/hq-interface-socket-daily/module/websocket/hq-watch-push-module?memberId=${memberId}`);
        ws.onopen = (evt) => {
            console.log('open')
            this.wsStatus = evt.type;
            console.log(evt)
            this.props.setWS(ws);
            this.heartBeat();
        };
        ws.onmessage = (evt) => {
            // console.log('message')
            // console.log(evt)
            if(evt.data.indexOf('{') > -1) {
                let data = Object.assign(JSON.parse(evt.data), {origin: evt.origin})
                if(data instanceof Object) {
                    this.setState(prevState =>({
                        originData: [...prevState.originData, data]
                    }))
                }
            }
            this.transFormData();
            this.heartBeat();
        };
        ws.onclose = (evt) => {
            console.log(evt)
            this.wsStatus = evt.type;
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
        this.setState({
            lockReconnect: true
        });
        this.reconnectTimer && clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.init();
            this.setState({
                lockReconnect: false
            }, parseInt(Math.random()*2000 + 3000))
        })
    }
// 心跳机制 30s向服务端发送一次心跳 60s超时关闭
    heartBeat = () => {
        this.heartTimer && clearTimeout(this.heartTimer);
        this.serverTimer && clearTimeout(this.serverTimer);
        this.heartTimer = setTimeout(() => {
            // 给服务端发送心跳包
            ws.send('HeartBeat');
            this.serverTimer = setTimeout(() => {
                ws.close()
            }, 60000)
        }, 30000)
    }

    closeConnect = () => {
        ws.close(); 
    }

    transFormData = () => {
        const deep_copy_origin_data = JSON.parse(JSON.stringify(this.state.originData));
        const msg = {
            type: 'initRecord',
            data: deep_copy_origin_data
        }
        myRecordWorker.postMessage(JSON.stringify(msg));
    }

    onRowClick = ({event, index, rowData}) => {
        console.log(rowData)
        this.stopPanelRefreshing();
        this.setState({
            details: rowData
        })
        this.showDrawer();
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
        // 超过30分钟关闭ws
        let diffTime = ''
        timer = setInterval(() =>{
            diffTime = momnet().diff(momnet(date), 'minute');
            if(diffTime > 30) {
              ws.close();
              clearInterval(timer)
            }
        }, 1000)
    }

    loadPrevious = () => {
        console.log('loadprevious')
        this.stopPanelRefreshing();
        myRecordWorker.postMessage(JSON.stringify({
          type: 'loadMore',
          data: -100
        }));
      }
    
    loadNext = () => {
        console.log('loadnext')
        this.stopPanelRefreshing();
        myRecordWorker.postMessage(JSON.stringify({
            type: 'loadMore',
            data: 100
        }));
    }

    stopPanelRefreshing = () => {
        this.refreshing = false;
        console.log('stop')
        myRecordWorker.postMessage(JSON.stringify({
            type: 'updateRefreshing',
            refreshing: false
        }));
    }

    resumeFresh = () => {
        this.setState({
            "showNewRecordTip": false
        });
        myRecordWorker.postMessage(JSON.stringify({
            type: 'updateRefreshing',
            refreshing: true
        }));
    }

    initRecrodPanelWrapperRef = (ref) => {
        this.recordTableRef = ref.querySelector('.ReactVirtualized__Table__Grid');
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
       console.log(scrollTop)
       if(scrollTop < this.lastScrollTop || this.lastScrollTop === 0) {
         this.detectIfToStopRefreshing(scrollTop);
         this.loadPrevious();
       } else if(scrollTop >= this.lastScrollTop) {
         this.loadNext();
       }
       this.lastScrollTop = scrollTop;
    }

      // if is scrolling up during refresh, will stop the refresh
    detectIfToStopRefreshing = (currentScrollTop) => {
        if (!this.stopRefreshTokenScrollTop) {
          this.stopRefreshTokenScrollTop = currentScrollTop;
        }

        this.stopRefreshTimout = setTimeout(() => {
            // if the scrollbar is scrolled up more than 50px, stop refreshing
            if ((this.stopRefreshTokenScrollTop - currentScrollTop) > 50) {
                this.stopPanelRefreshing();
                this.stopRefreshTokenScrollTop = null;
            }
        }, 50);
    }

    handleOpenMOdal = () => {
        this.setState({
            modalVisible: true
        })
    }

    handleCloseModal = () => {
        this.setState({
            modalVisible: false
        })
    }

    componentDidMount() {
        myRecordWorker.onmessage = e => {
            const data = JSON.parse(e.data)
            const filterRcordList = data.recordList
            switch(data.type) {
                case 'updateData': {
                    if(data.shouldUpdateRecord) {
                        this.dataSource = [];
                        filterRcordList.forEach((item) => {
                           const obj = {
                               start_time: formatTime(item.request.requestTime/1000),
                               application: 'hs-interface-socket-daily',
                               duration: item.costTime,
                               origin: item.origin,
                               path: item.request.requestMsgType,
                               type: item.type,
                               id: item.id,
                               request: item.request,
                               response: item.response
                            };
                            this.dataSource.push(obj)
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
            if(currLocation.pathname && timer) {
              clearInterval(timer)
            }
            window.addEventListener('visibilitychange', () => {
                if(document.visibilityState === 'hidden' && window.location.href.indexOf('/capture/content') > -1) {
                    console.log('离开')
                    const date = new Date();
                    if(timer){
                      clearInterval(timer)
                    }
                    this.startCountTime(date)
                }
                if(document.visibilityState === 'visible') {
                    console.log('回来');
                    if(window.location.href.indexOf('/capture/content') > -1) {
                        clearInterval(timer)
                    }
                }
            })
          })
    }

    render () {
        const formRef = createRef();
        const { type, application, start_time, duration, origin, path, request, response } = this.state.details
        const pStyle = {
            fontSize: 16,
            color: 'rgba(0,0,0,0.85)',
            lineHeight: '24px',
            display: 'block',
            marginBottom: 16,
        };
        let color;
        if(type === 'pull') {
            color = 'green'
        } else {
            color = 'greeblue'
        }   
        return (
            <div className="capture-main" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                <Button type="primary" onClick={this.handleOpenMOdal} style={{marginRight: '15px'}}>Open</Button>
                <Button type="primary" disabled={!this.props.ws} onClick={this.closeConnect}>Close</Button>
                <span style={{paddingRight:  '10px'}}>原始数据量: {this.state.originData.length}</span>
                <span>table数据量: {this.dataSource.length}</span>
                <div style={{marginTop: '15px'}} ref={this.initRecrodPanelWrapperRef}>
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
                            rowCount={this.dataSource.length}
                            rowGetter={({index}) => this.dataSource[index]}>
                            <Column label="Application" dataKey="application"  width={120} flexGrow={1}
                                cellRenderer={({rowData, rowIndex}) => {
                                    let color;
                                    if(rowData.type === 'pull') {
                                        color = 'green'
                                    } else {
                                        color = 'greeblue'
                                    }
                                    return (
                                        <span title={rowData.id}>
                                            <span>{rowData.id}</span>
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
                              return (<span>{rowData.duration + 'ms'}</span>)   
                            }}></Column>
                        </Table>
                    )}
                    </AutoSizer>
                    {this.state.showNewRecordTip && <div onClick={this.resumeFresh}><span>New Records Detected.</span></div>}
                </div>
                {this.state.visible &&
                <Drawer
                    title={<span><Tag color={color} key={type}>{type}</Tag>{application}</span>}
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
                            <DescriptionItem title="Duration" content={duration + 'ms'}/>
                        </Col>
                    </Row>  
                    <Divider />  
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
                </Drawer>}
                {this.state.modalVisible && 
                <CaptureServiceForm 
                visible={this.state.modalVisible} 
                close={this.handleCloseModal} 
                wrappedComponentRef={formRef} 
                init={this.init}
                wsStatus={this.wsStatus}>
                </CaptureServiceForm>}
            </div>
        )
    }
}

export default CaptureContent;
