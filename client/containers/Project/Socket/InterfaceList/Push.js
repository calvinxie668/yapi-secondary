import React, { PureComponent as Component } from 'react';
import { Radio, Row, Col, Table, Button, Divider, Modal, Input, Popconfirm, Switch, Form, message } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getCronList, updateCron } from '../../../../reducer/modules/cron.js';
import axios from 'axios';
import { formatTime } from '../../../../common.js';
import { withRouter } from 'react-router-dom';
import AceEditor from 'client/components/AceEditor/AceEditor';
const FormItem = Form.Item;

@connect(
    state => {
      return {
        data: state.cron.data,
      }
    },
    {
      getCronList,
      updateCron
    }
  )

class socketPush  extends Component {
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
                          <Switch checkedChildren="开" unCheckedChildren="关" checked={text.push_switch_status} onChange={(checked) => this.handlePushSwitch(checked, record)}/>
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
            }
          })
        }
    };

    handleSubmitCron = (e, type) => {
        e.preventDefault();
        let projectId = this.props.match.params.id;
        let socket_id = this.props.match.params.actionId;
        if(type === 'add') {
          this.props.form.validateFieldsAndScroll(['stock_codes', 'times', 'minute', 'name'], (err, values) => {
            if(!err) {
              let params = {
                project_id: projectId,
                socket_id,
                ...values
              }
              console.log(params)
              axios.post('/api/cron/add', params)
              .then(res => {
                if (res.data.errcode === 0) {
                  message.success('新建成功');
                  this.props.getCronList(socket_id, 1 , this.state.pagination.pageSize)
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
          this.props.form.validateFieldsAndScroll(['stock_codes', 'times', 'minute', 'name'], (err, values) => {
            if(!err) {
              let params = {
                project_id: projectId,
                socket_id,
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
        let socket_id = this.props.match.params.actionId;
        this.props.getCronList(socket_id, this.state.pagination.current , this.state.pagination.pageSize)
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
    
      handlePushSwitch = (checked, record) => {
        let status = checked ? 1 : 0;
        if(checked) {
          this.handelPushMock(record)
          .then(res => {
            status = !!res ? 1 : -1;
          })
        } else {
          this.handelCancelPushMock(record)
        }
        this.handleUpdate(record._id, {
          status,
          push_switch_status: checked
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
        let socket_id = this.props.match.params.actionId;
        const {minute, times, stock_codes, _id} = record;
        const params = {
          socket_id,
          minute,
          times,
          stock_codes,
          cron_id: _id
        }
        return new Promise(resolve => {
          axios.post('/api/mock/push', params)
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
        return axios.post('/api/mock/cancel_push', {
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
        console.log(record)
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

    componentWillMount () {
        let interfaceId = this.props.match.params.actionId;
        this.props.getCronList(interfaceId, 1 , this.state.pagination.pageSize)
        .then(() => {
            const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
            this.setState({ 
                pagination: data
            })
        });
        if(this.state.tab === 'single') {
            this.getOncePushData(interfaceId)
        }
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
          <div style={{paddingTop: '20px'}}>
            <div style={{textAlign: 'center', paddingBottom: '15px'}}>
                <Radio.Group defaultValue={this.state.tab} buttonStyle="solid" onChange={this.handleChangeTab}>
                    <Radio.Button value="single">单次推送</Radio.Button>
                    <Radio.Button value="cron">定时推送</Radio.Button>
                </Radio.Group>
            </div>
            <div style={{display: this.state.tab === 'single'? 'block': 'none'}}>
                <Form onSubmit={this.handleSubmitSinglePush}>
                    <FormItem label="股票代码" {...formItemLayout}>
                        {
                            getFieldDecorator('stock_codes_single', {
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
                    <FormItem label="推送内容" {...formItemLayout}>
                        {

                        getFieldDecorator('content', {
                            rules: [{
                                required: true,
                                message: '推送内容不能为空'
                            }]
                        })(<AceEditor data={aceContent} mode="javascript" style={{ minHeight: 600 }} onChange={(d) => {
                            this.setState({
                                content: d.text
                            })
                        }} />)
                        }
                    </FormItem>
                    <FormItem {...tailFormItemLayout}>
                        <Button type="primary" style={{marginRight: '15px'}} onClick={this.handleSaveSinglePush}>
                            保存
                        </Button>
                        <Button type="primary" htmlType="submit">
                            推送
                        </Button>
                    </FormItem>
                </Form>
            </div>
            <div style={{display: this.state.tab === 'cron' ? 'block': 'none'}}>
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
                            let socket_id = this.props.match.params.actionId;
                            const data = Object.assign({}, this.state.pagination,  { current: page })
                            this.setState({
                                pagination: data
                            })
                            this.props.getCronList(socket_id, page, pageSize)
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
                    </Form>
            </Modal>
          </div>  
        )
    }
}

export default Form.create()(withRouter(socketPush));