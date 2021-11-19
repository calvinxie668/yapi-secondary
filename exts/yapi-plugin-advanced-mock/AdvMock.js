import React, { Component } from 'react';
// import { connect } from 'react-redux'
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form, Switch, Button, message, Icon, Tooltip, Radio, Table, Row, Col, Divider, Modal, Input, Popconfirm } from 'antd';
import MockCol from './MockCol/MockCol.js';
import mockEditor from 'client/components/AceEditor/mockEditor';
import constants from '../../client/constants/variable.js';
import { getCronList } from '../../client/reducer/modules/cron.js'
import { formatTime } from '../../client/common.js';
import _ from 'lodash';
const FormItem = Form.Item;

@connect(
  state => {
    return {
      data: state.cron.data,
      socketListCurrenData: state.inter.curdata
    }
  },
  {
    getCronList
  }
)
class AdvMock extends Component {
  static propTypes = {
    form: PropTypes.object,
    match: PropTypes.object,
    getCronList: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      enable: false,
      visible: false,  
      pagination: {
        current: 1,
        pageSize: 10,
        total: null
      },
      type: 'add',
      cronId: null,
      mock_script: '',
      tab: 'case',
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
              key: 'push_switch',
              render: (text, record) => {
                return (
                  <Switch checkedChildren="开" unCheckedChildren="关" onChange={(checked) => this.handlePushSwitch(checked, record)}/>
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
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    let projectId = this.props.match.params.id;
    let interfaceId = this.props.match.params.actionId;
    let params = {
      project_id: projectId,
      interface_id: interfaceId,
      mock_script: this.state.mock_script,
      enable: this.state.enable
    };
    axios.post('/api/plugin/advmock/save', params).then(res => {
      if (res.data.errcode === 0) {
        message.success('保存成功');
      } else {
        message.error(res.data.errmsg);
      }
    });
  };

  handleSubmitCron = (e, type) => {
    e.preventDefault();
    let projectId = this.props.match.params.id;
    let socket_id = this.props.match.params.actionId;
    if(type === 'add') {
      this.props.form.validateFieldsAndScroll((err, values) => {
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
      this.props.form.validateFieldsAndScroll((err, values) => {
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
    let projectId = this.props.match.params.id;
    let socket_id = this.props.match.params.actionId;
    e.preventDefault();
    axios.post('/api/cron/del', {id: record._id, project_id: projectId})
    .then(res => {
      message.success('删除成功');
      this.props.getCronList(socket_id, 1 , 10)
      .then(() => {
        const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
        this.setState({
          pagination: data
        })
      });
    })
    .catch(err => {
      console.log(err)
    })
  } 
  handleCancel = e => {
    this.setState({visible: false});
  }

  handlePushSwitch = (checked, record) => {
    if(checked) {
      this.handelPushMock(record);
    } else {
      this.handelCancelPushMock(record);
    }
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
    axios.post('/api/mock/push', params)
    .then(res => {
      if(res.data.data.success) {
        message.success('正在开始推送...');
        this.updateStatus(record._id, 1);
      } else {
        message.error('推送失败');
        this.updateStatus(record._id, -1);
      }
    })
    .catch(err => {
      console.log(err);
    }) 
  }

  handelCancelPushMock = (record) => {
    axios.post('/api/mock/cancel_push', {
      cron_id: record._id
    })
    .then(res => {
      message.success(`${record.name}推送任务已关闭`);
      this.updateStatus(record._id, 0);
    })
    .catch(err => {
      console.log(err);
    })
  }

  componentWillMount() {
    let interfaceId = this.props.match.params.actionId;
    this.props.getCronList(interfaceId, 1 , this.state.pagination.pageSize)
    .then(() => {
      const data = Object.assign({}, this.state.pagination,  { total: this.props.data.total })
      this.setState({
        pagination: data
      })
    });
    this.getAdvMockData();
  }

  async getAdvMockData() {
    let interfaceId = this.props.match.params.actionId;
    let result = await axios.get('/api/plugin/advmock/get?interface_id=' + interfaceId);
    if (result.data.errcode === 0) {
      let mockData = result.data.data;
      this.setState({
        enable: mockData.enable,
        mock_script: mockData.mock_script
      });
    }

    let that = this;
    mockEditor({
      container: 'mock-script',
      data: that.state.mock_script,
      onChange: function(d) {
        that.setState({
          mock_script: d.text
        });
      }
    });
  }

  onChange = v => {
    this.setState({
      enable: v
    });
  };

  handleTapChange = e => {
    this.setState({
      tab: e.target.value
    });
  };

  onSelectChange = (selectedRowKeys, selectedRows) => {
    console.log(selectedRows)
  }

  onSelectCurrentRow = (e, text, record) => {
    e.preventDefault();
    console.log(record)
    this.showModal('edit', record)
  }

  render() {
    const { method } = this.props.socketListCurrenData;
    const { getFieldDecorator } = this.props.form;
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
    const { tab } = this.state;
    const isShowCase = tab === 'case';
    const isShowCron = !!(this.props.match.url.indexOf('socket') > -1) && method === 'PUSH'
    return (
      <div style={{ padding: '20px 10px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Radio.Group value={tab} size="large" onChange={this.handleTapChange}>
            <Radio.Button value="case">期望</Radio.Button>
            <Radio.Button value="script">脚本</Radio.Button>
          </Radio.Group>
        </div>
        <div style={{ display: isShowCase ? 'none' : '' }}>
          <div style={{ display: !isShowCron ? 'none' : '' }}>
            <Row>
              <Col span={4} offset={4}>
                <Button type="primary" onClick={() => this.showModal('add')}>添加任务</Button>
              </Col>
            </Row>
            <Row style={{ marginTop: '15px'}}>
              <Col span={16} offset={4}>
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
          <Form onSubmit={this.handleSubmit}>
            <FormItem
              label={
                <span>
                  是否开启&nbsp;<a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={constants.docHref.adv_mock_script}
                  >
                    <Tooltip title="点击查看文档">
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </a>
                </span>
              }
              {...formItemLayout}
            >
              <Switch
                checked={this.state.enable}
                onChange={this.onChange}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </FormItem>

            <FormItem label="Mock脚本" {...formItemLayout}>
              <div id="mock-script" style={{ minHeight: '500px' }} />
            </FormItem>
            <FormItem {...tailFormItemLayout}>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </FormItem>
          </Form>
        </div>
        <div style={{ display: isShowCase ? '' : 'none' }}>
          <MockCol />
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
    );
  }
}

module.exports = Form.create()(withRouter(AdvMock));
