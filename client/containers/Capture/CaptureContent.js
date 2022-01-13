import React, { PureComponent as Component, forwardRef, useImperativeHandle, createRef, Fragment } from "react";
import { Button, Tag, Drawer, Row, Col, Divider, Modal, Input, Form, Select, Collapse, Radio } from 'antd'; 
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
import { T } from "antd/lib/upload/utils";
let timer = null;
let ws= null;
// const columns = [
//     {
//         title: 'Application',
//         dataIndex: 'application',
//         render: (data, rowData) => {
//             let color;
//             if(rowData.type === 'pull') {
//                 color = 'green'
//             } else {
//                 color = 'greeblue'
//             }
//             return (
//                 <span title={rowData.id}>
//                     <span>{rowData.id}</span>
//                     <Tag  color={color} key={rowData.type}>
//                         {rowData.type}
//                     </Tag>
//                     <span>{rowData.application}</span>
//                 </span>
//             )
//         }
//     },
//     {
//         title: 'Origin',
//         dataIndex: 'origin',
//         key:'origin',
//     },
//     {
//         title: 'Path',
//         dataIndex: 'path',
//         key:'path',
//     },
//     {
//         title: 'Start',
//         dataIndex: 'start_time',
//         key:'start_time',
//     },
//     {
//         title: 'Duration',
//         dataIndex: 'duration',
//         key:'duration',
//         width: 150,
//         render: (data, rowData ) => {
//             return (<span>{rowData.duration + 'ms'}</span>)  
//         }
        
//     },
// ]
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
            curRowIndex: null
        }
        this.refreshing = true;
        this.recordTableRef = null;
        this.scrollHandlerTimeout = null;
        this.stopRefreshTimout = null;
        this.lastScrollTop = 0;
        this.stopRefreshTokenScrollTop = null;
        this.dataSource = [];
        this.wsStatus = null;
        this.services = [];
        this.wsUrlData = {}
    }

    init = (memberId) => {
        if(!memberId) return;
        if(JSON.stringify(this.wsUrlData) === '{}') return;
        // ws = new WebSocket(`ws://a4edab67387824305b6b2b16ec2ce0ce-28ea69bc91b31528.elb.ap-east-1.amazonaws.com:6699/sandbox/hq-interface-push-pc-daily/module/websocket/hq-watch-push-module?memberId=${memberId}`);
        const wsDomain = this.wsUrlData.extranet
        const wsPath = this.wsUrlData.name
        ws = new WebSocket(`ws://${wsDomain}:6699/sandbox/${wsPath}/module/websocket/hq-watch-push-module?memberId=${memberId}`);
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
                if(data instanceof Object) {
                    this.setState(prevState =>({
                        originData: [...prevState.originData, data]
                    }))
                }
            }
            // this.transFormData();
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
            this.init(this.state.memberId);
            this.setState({
                lockReconnect: false
            })
        }, parseInt(Math.random()*2000 + 3000))
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

    handleClearData = () => {
        // // 一键清空数据
        this.setState({
            originData: []
        })
        this.dataSource = []
        myRecordWorker.postMessage(JSON.stringify({
            type: 'clear'
        }));
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
        this.setState({
            curRowIndex: index
        })
        this.stopPanelRefreshing();
        this.setState({
            details: rowData
        })
        this.showDrawer();
    }
    handleClickRow = (event, rowData) => {
        this.setState({
            curRowIndex: rowData.id
        })
        event.preventDefault();
        this.stopPanelRefreshing();
        this.setState({
            details: rowData
        })
        this.showDrawer();
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
        this.stopRefreshTimout && clearTimeout(this.stopRefreshTimout);
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

    handleOnSearch = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
          const msg = {
              type: 'updateQuery',
              filterObj: values
          };
        
          myRecordWorker.postMessage(JSON.stringify(msg));
        });
    }

    handleReset = () => {
        this.props.form.resetFields();
        this.props.form.validateFields((err, values) => {
            const msg = {
                type: 'updateQuery',
                refreshing: false,
                filterObj: values
            };
          
            myRecordWorker.postMessage(JSON.stringify(msg));
        });
    }

    getTopicIdList = async () => {
        await this.props.getTopicIdList({method: 'PUSH'});
    }

    onChangeRadio = (e) => {

    }

    componentDidMount() {
        this.getOptions();
        this.getTopicIdList();
        myRecordWorker.onmessage = e => {
            const data = JSON.parse(e.data)
            switch(data.type) {
                case 'updateData': {
                    if(data.shouldUpdateRecord) {
                        const filterRcordList = data.recordList.reverse()
                        this.dataSource = [];
                        let obj = null;
                        filterRcordList.forEach((item) => {
                           if(item.type === 'pull')  {
                               obj = {
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
                           } else {
                               obj = {
                                    start_time: '--',
                                    application: 'hs-interface--push-pc-daily',
                                    origin: item.origin,
                                    path: item.msgType,
                                    type: item.type,
                                    topicId: item.topicId || '--',
                                    id: item.id,
                                    notify: item.payload,
                                    duration: '--'
                               }
                           }
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
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 }
        };
        const { type, application, start_time, duration, origin, path, request, response, id: row_id, topicId, notify } = this.state.details
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
                <Button type="primary" onClick={this.handleOpenMOdal} style={{marginRight: '15px'}}>Open</Button>
                <Button type="primary" disabled={!this.props.ws} style={{marginRight: '15px'}} onClick={this.closeConnect}>Close</Button>
                <Button type="primary" disabled={!this.dataSource.length} onClick={this.handleClearData}>Clear</Button>
                {/* <span style={{paddingRight:  '10px'}}>原始数据量: {this.state.originData.length}</span>
                <span>table数据量: {this.dataSource.length}</span> */}
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
                                            (<Radio.Group onChange={this.onChangeRadio}>
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
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item {...formItemLayout}>
                                        {
                                           getFieldDecorator('key1')
                                           (<Input placeholder="消息内容任意值可支持正则"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item  {...formItemLayout}>
                                        {
                                           getFieldDecorator('key2')
                                           (<Input placeholder="消息内容任意值可支持正则"></Input>) 
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item {...formItemLayout}>
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
                            rowStyle={this.rowStyleFormat}
                            rowCount={this.dataSource.length}
                            rowGetter={({index}) => this.dataSource[index]}>
                            <Column label="Application" dataKey="application"  width={120} flexGrow={1}
                                cellRenderer={({rowData, rowIndex}) => {
                                    let color;
                                    if(rowData.type === 'pull') {
                                        color = '#669900'
                                    } else {
                                        color = '#FF9933'
                                    }
                                    return (
                                        <span title={rowData.id}>
                                            <span style={{paddingRight: '5px'}}>{rowData.id.split('-')[2]}</span>
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
                              return (<span>{type === 'pull' ? rowData.duration + 'ms' : '--'}</span>)   
                            }}></Column>
                        </Table>
                    )}
                    </AutoSizer>
                    {/* <Table 
                     columns={columns} 
                     dataSource={this.dataSource} 
                     pagination={false} 
                     scroll={{ y: 640 }} 
                     rowKey='id'
                     rowClassName={this.rowStyleFormat}
                     onRow={record => { return { onClick: e =>  this.handleClickRow(e, record)}}}
                     >
                    </Table> */}
                    {this.state.showNewRecordTip && <div onClick={this.resumeFresh} className="detected"><span className="detected-name">New Records Detected.<span className="arrowDown"></span></span></div>}
                </div>
                {this.state.visible &&
                <Drawer
                    title={<span style={{paddingRight: '5px'}}>{row_id.split('-')[2]}<Tag color={color} key={type}>{type}</Tag>{application}</span>}
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
