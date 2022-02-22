import React, { PureComponent as Component } from 'react';
import { Radio, Row, Col, Table, Button, Divider, Modal, Input, Popconfirm, Switch, Form, message, Select, Tag } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getCronList, updateCron } from '../../client/reducer/modules/cron.js';
import { getTopicIdList } from '../../client/reducer/modules/interface.js';
import axios from 'axios';
import { formatTime } from '../../client/common.js';
import { withRouter } from 'react-router-dom';
import AceEditor from 'client/components/AceEditor/AceEditor';
const http  =  require('../../common/http-debounce.js'); 
const FormItem = Form.Item;
const Option = Select.Option;

@connect(
    state => {
      return {
        data: state.cron.data,
				pushIntefaces: state.inter.topicIdList
      }
    },
    {
      getCronList,
			updateCron,
			getTopicIdList
    }
  )

class CronPush  extends Component {
    static propTypes = {
        getCronList: PropTypes.func,
        updateCron: PropTypes.func,
        match: PropTypes.object
    }
    
    constructor(props) {
        super(props);
        this.state = {
            visible: false,  
            tab: 'single',
            pagination: {
              current: 1,
              pageSize: 10,
              total: null
            },
            type: 'add',
            cronId: null,
            content: {},
            columns: [
                {
                  title: '任务名称',
                  key: 'name',
                  dataIndex: 'name'
                },
                {
                  title: '频率',
                  key: 'freq',
                  dataIndex: 'freq',
                  render: (text, record) => {
                    const freq = `${record.times}次/${record.minute}min` 
                    return (
                      <span>{freq}</span>
                    )
                  }
                },
                {
                  title: '股票代码',
                  key: 'stock_codes',
                  dataIndex: 'stock_codes'
                },
								{
									title: '推送接口',
									key: 'push_interface',
									dataIndex: 'push_interface',
									width: 360,
									render: (text, record) => {
										if(Array.isArray(text)) {
											return text.map(item => {
												const obj = JSON.parse(item);
												const project_id = this.props.match.params.id;
												return (<Tag key={obj.id} style={{"cursor": "pointer", "marginBottom": "8px"}} color="blue" onClick={() => this.props.history.push(`/project/${project_id}/socket/api/${obj.id}`)}>{obj.name}</Tag>);
											})
										}
									}
								},
                {
                  title: '状态',
                  key: 'status',
                  dataIndex: 'status',
                  render: (text, record) => {
                    const status = text == 1 ? '推送中' : text == -1 ? '推送失败' : '未开启';
                    return (
                      <span>{status}</span>
                    )
                  }
                },
                {
                  title: '创建人',
                  key: 'username',
                  dataIndex: 'username'
                },
                {
                  title: '创建时间',
                  key: 'add_time',
                  dataIndex: 'add_time',
                  render: (text, record) => {
                    return(
                      <span>{formatTime(text)}</span>
                    )
                  }
                },
                {
                  title: '更新时间',
                  key: 'up_time',
                  dataIndex: 'up_time',
                  render: (text, record) => {
                    return(
                      <span>{formatTime(text)}</span>
                    )
                  }
                },
                {
                  title: '操作',
                  key: 'action',
                  children: [
                    {
                      title: '是否开启推送',
                      key: 'push_switch_status',
                      render: (text, record) => {
                        return (
                          <Switch checkedChildren="开" unCheckedChildren="关"  checked={text.push_switch_status} onChange={(checked) => this.handlePushSwitch(checked, record)}/>
                        )
                      }
                    },
                    {
                      title: '常规',
                      key: 'general_action',
                      render: (text, record) => {
                        return (
                        <span>
                          <a onClick={(e) => this.onSelectCurrentRow(e, text, record)}>编辑</a>
                          <Divider type="vertical" />
                          <Popconfirm
                            title={`删除后不可恢复,你确定删除${record.name}?`}
                            onConfirm={ e => this.handelDelCron(e, text, record)}
                            okText="是"
                            cancelText="否"
                          >
                            <a>删除</a>
                          </Popconfirm>
                        </span>
                        )
                      }
                    }
                  ]
                }
            ]
        } 
    };

    handleSubmitCron = (e, type) => {
        e.preventDefault();
        let projectId = this.props.match.params.id;
        if(type === 'add') {
          this.props.form.validateFieldsAndScroll(['stock_codes', 'times', 'minute', 'name', 'push_interface'], (err, values) => {
            if(!err) {
              let params = {
                project_id: projectId,
                ...values
              }
              console.log(params)
              axios.post('/api/cron/add', params)
              .then(res => {
                if (res.data.errcode === 0) {
                  message.success('新建成功');
                  this.props.getCronList(projectId, 1 , this.state.pagination.pageSize)
                  .then(() => {
                    const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
                    this.setState({
                      pagination: data
                    })
                  });
                  this.setState({visible: false});
                } else {
                  message.error(res.data.errmsg);
                }
              })
              .catch(error => {
                console.log(error)
              })
            } 
          })
        }
        if(type === 'edit') {
          this.props.form.validateFieldsAndScroll(['stock_codes', 'times', 'minute', 'name', 'push_interface'], (err, values) => {
            if(!err) {
              let params = {
                project_id: projectId,
                id: this.state.cronId,
                ...values
              }
              console.log(params)
              axios.post('/api/cron/up', params)
              .then(res => {
                if (res.data.errcode === 0) {
                  message.success('保存成功');
                  this.updateList()
                  this.setState({visible: false});
                } else {
                  message.error(res.data.errmsg);
                }
              })
              .catch(error => {
                console.log(error)
              })
            } 
          })
        }
      };
      updateList () {
        let project_id = this.props.match.params.id;
        this.props.getCronList(project_id, this.state.pagination.current , this.state.pagination.pageSize)
        .then(() => {
          const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
          this.setState({
            pagination: data
          })
        });
      };
    
			showModal = (type, data) => {
        this.setState({ type })
        if(type === 'add') {
          this.setState({
            visible: true
          });
          this.props.form.resetFields();
        } 
        if(type === 'edit') {
          this.setState({
            visible: true,
            cronId: data._id
          });
          this.props.form.setFields({
            name: {
              value: data.name
            },
            times: {
              value: data.times
            },
            minute: {
              value: data.minute
            },
            stock_codes: {
              value: data.stock_codes
            },
						push_interface: {
							value: data.push_interface
						}
          })
        }
      };
    
      handelDelCron = (e, text, record) => {
        e.preventDefault();
        let projectId = this.props.match.params.id;
        axios.post('/api/cron/del', {id: record._id, project_id: projectId})
        .then(res => {
          message.success('删除成功');
          if(record.push_switch_status) {
            this.handelCancelPushMock(record);
            this.handleUpdate(record._id, {
              status: 0,
              push_switch_status: false
            })
            return false
          }
          this.updateList()
        })
        .catch(err => {
          console.log(err)
        })
      } 
      handleCancel = e => {
        this.setState({visible: false});
      }
    
      handlePushSwitch = async(checked, record) => {
        let status = checked ? 1 : 0;
        if(checked) {
          // this.handleUpdate(record._id, {
          //   switch_loading: true
          // })
          await this.handelPushMock(record)
          .then(res => {
            this.status = !!res ? 1 : -1;
          })
        } else {
          await this.handelCancelPushMock(record)
        }
        this.handleUpdate(record._id, {
          status,
          push_switch_status: checked,
          // switch_loading: false
        })
      }
    
      updatePushSwitchStatus = (id, push_switch_status) => {
        let project_id = this.props.match.params.id;
        axios.post('/api/cron/up', {
          id,
          project_id,
          push_switch_status
        }).then(() => {
        }).catch(err =>{
          console.log(err);
        })
      }
    
      updateStatus = (id, status) => {
        let project_id = this.props.match.params.id;
        axios.post('/api/cron/up', {
          id,
          project_id,
          status
        }).then(() => {
          this.updateList();
        }).catch(err =>{
          console.log(err);
        })
      };
    
      handleUpdate = (id, data) => {
        let project_id = this.props.match.params.id;
        const params = {
          id,
          project_id,
          ...data
        }
        this.props.updateCron(params)
        .then(() => {
          this.updateList()
        })
      };
    
      handelPushMock = (record) => {
        const {minute, times, stock_codes, _id, push_interface} = record;
				const socket_ids =  push_interface.map(item => {
					return JSON.parse(item)['id']
				})
        const params = {
          socket_ids,
          minute,
          times,
          stock_codes,
          cron_id: _id
        }
        return new Promise(resolve => {
          http.post('/api/mock/push', params)
          .then(res => {
            if(res.data.data.success) {
              message.success('正在开始推送...');
            } else {
              message.error('推送失败');
            }
            resolve(res.data.data.success)
          })
          .catch(err => {
            console.log(err);
          }) 
        })
      }
    
      handelCancelPushMock = (record) => {
        return http.post('/api/mock/cancel_push', {
          cron_id: record._id
        })
        .then(res => {
          message.success(`${record.name}推送任务已关闭`);
        })
        .catch(err => {
          console.log(err);
        })
      }

      onSelectChange = (selectedRowKeys, selectedRows) => {
        console.log(selectedRows)
      }
    
      onSelectCurrentRow = (e, text, record) => {
        e.preventDefault();
        this.showModal('edit', record)
      }

      getOncePushData = (socket_id) => {
        axios.get('/api/mock/once_push_list', {
            params: {
                socket_id
            }
        })
        .then(res => {
            if(res.data.data != null) {
                const data = res.data.data;
                this.setState({
                    content:  data.content
                })
                this.props.form.setFieldsValue({
                    stock_codes_single: data.stock_codes_single,
                    content: data.content
                })
            }
        })
        .catch(err => {
            console.log(err);    
        })
      };

      UNSAFE_componentWillMount () {
				this.props.getTopicIdList({method: 'PUSH'});
        let project_id = this.props.match.params.id;
        this.props.getCronList(project_id, 1 , this.state.pagination.pageSize)
        .then(() => {
            const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
            this.setState({ 
                pagination: data
            })
        });
    };
    handleChangeTab = (e) => {
        this.setState({
            tab: e.target.value
        })
    }
    handleSaveSinglePush = (e) => {
        e.preventDefault();
        let interfaceId = this.props.match.params.actionId;
        this.props.form.validateFields(['stock_codes_single', 'content'], (err, values) => {
            if(!err) {
                axios.post('/api/mock/up_once_push', {stock_codes_single: values.stock_codes_single, socket_id: interfaceId, content: this.state.content})
                .then(res => {
                    if(res.data.success) {
                        message.success('保存成功')
                    }
                })
                .catch(err => {
                    console.log(err);
                })
            }
        });
    };

    handleSubmitSinglePush = (e) => {
        e.preventDefault();
        let interfaceId = this.props.match.params.actionId;
        this.props.form.validateFieldsAndScroll(['stock_codes_single', 'content'], (err, values) => {
            if(!err) {
                console.log(values)
                axios.post('/api/mock/push_once', {
                    socket_id: interfaceId,
                    stock_codes_single: values.stock_codes_single,
                    content: this.state.content
                })
                .then(res => {
                    if(res.data.data.success) {
                        message.success(res.data.data.msg);
                        return  
                    }
                    message.error(res.data.data.msg);
                })
                .catch(err => {})
            }
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const aceContent = this.state.content;
        const formItemLayout = {
          labelCol: {
            sm: { span: 4 }
          },
          wrapperCol: {
            sm: { span: 16 }
          }
        };
        const tailFormItemLayout = {
            wrapperCol: {
              sm: {
                span: 16,
                offset: 11
              }
            }
        };
        return (
          <div style={{paddingTop: '20px', backgroundColor: '#fff'}}>
            <div>
                <Row>
                    <Col span={4} offset={1}>
                        <Button type="primary" onClick={() => this.showModal('add')}>添加任务</Button>
                    </Col>
                </Row>
                <Row style={{ marginTop: '15px'}}>
                    <Col span={22} offset={1}>
                        <Table 
                        columns={this.state.columns} 
                        dataSource={this.props.data.list} 
                        bordered
                        pagination={{
                        'current': this.state.pagination.current, 
                        'total': this.state.pagination.total,
                        'pageSize': this.state.pagination.pageSize,
                        'onChange': (page, pageSize) => {
													let project_id = this.props.match.params.id;
                            const data = Object.assign({}, this.state.pagination,  { current: page })
                            this.setState({
                                pagination: data
                            })
                            this.props.getCronList(project_id, page, pageSize)
                            .then(() => {
                                const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
                                this.setState({
                                    pagination: data
                                })
                            });
                        }
                        }} 
                        rowKey="_id"/>
                    </Col>
                </Row>
            </div>
            <Modal 
                title={this.state.type ==='add' ? "添加定时任务" : "编辑定时任务"} 
                visible={this.state.visible}
                onOk={e => this.handleSubmitCron(e, this.state.type)}
                onCancel={this.handleCancel}
                footer={[
                    <Button key="back" onClick={this.handleCancel}>
                    取消
                    </Button>,
                    <Button key="submit" type="primary" onClick={e => this.handleSubmitCron(e, this.state.type)} htmlType="submit">
                    {this.state.type === 'add' ? "新建" : "保存"}
                    </Button>
                ]}
                >
                    <Form onSubmit={e => this.handleSubmitCron(e, this.state.type)}>
                    <FormItem label="名字" {...formItemLayout}>
                        {
                        getFieldDecorator('name', {
                            rules: [
                            { 
                                required: true,
                                message: '请填写任务名字'
                            },
                            { 
                                max: 20,
                                message: '字符长度不超过20字'
                            }
                            ]
                        })(<Input placeholder="请填写任务名字"/>)
                        }
                    </FormItem>
                    <FormItem label="次数" {...formItemLayout}>
                        {
                        getFieldDecorator('times', {
                            rules: [
                            {
                                required: true,
                                message: '请填写次数'
                            },
                            {
                                type: 'number',
                                message: '请输入number类型',
                                transform(value) {
                                return Number(value);
                                },
                            }
                            ]
                        })(<Input placeholder="请填写次数"/>)
                        }
                    </FormItem>
                    <FormItem label="分钟" {...formItemLayout}>
                    {
                        getFieldDecorator('minute', {
                            rules: [
                            {
                                required: true,
                                message: '请填写分钟'
                            },
                            {
                                type: 'number',
                                message: '请输入number类型',
                                transform(value) {
                                return Number(value);
                                },
                            }
                            ]
                        })(<Input placeholder="请填写分钟"/>)
                        }
                    </FormItem>
                    <FormItem label="股票代码" {...formItemLayout}>
                    {
                        getFieldDecorator('stock_codes', {
                            rules: [
                            {
                                required: true,
                                message: '请填写股票代码'
                            },
                            {
                                type: 'string',
                                message: '请输入字符串类型'
                            }
                            ]
                        })(<Input.TextArea placeholder="请填写股票代码,多个用英文逗号分隔"/>)
                        }
                    </FormItem>
                    <FormItem label="推送接口" {...formItemLayout}>
                    {
                        getFieldDecorator('push_interface', {
                            rules: [
                            {
                                required: true,
                                message: '请选择股票代码'
                            },
                         
                            ]
												})(<Select  mode="multiple" placeholder="请选择推送接口">
													{this.props.pushIntefaces.map(item => {
														const obj = JSON.stringify({ id: item._id, name: item.title})
														return <Option key={obj}>{item.title}</Option>
													})}
												</Select>)
                        }
                    </FormItem>
                    </Form>
            </Modal>
          </div>  
        )
    }
}

export default Form.create()(withRouter(CronPush));