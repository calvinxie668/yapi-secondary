import React, { PureComponent as Component } from "react";
import { Button, Table, Modal, Form, Input, Select, message, Divider, Popconfirm } from 'antd'; 
import { formatTime } from '../../common.js'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
    getCaptureList,
    addCapture,
    updateCapture,
    delCapture
  } from '../../reducer/modules/capture.js';
@connect(
    state => {
      return {
        captureData: state.capture.data
      };
    },
    {
        getCaptureList,
        addCapture,
        updateCapture,
        delCapture
    }
)
class CaptureService extends Component {
    static propTypes = {
        curData: PropTypes.object,
        getCaptureList: PropTypes.func,
        addCapture: PropTypes.func,
        delCapture: PropTypes.func,
        updateCapture: PropTypes.func
      };
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            columns: [
                {
                    title: '服务名称',
                    dataIndex: 'name',
                    key: 'name',
                },
                {
                    title: '内网域名',
                    dataIndex: 'intranet',
                    key: 'intranet',
                },
                {
                    title: '外网域名',
                    dataIndex: 'extranet',
                    key: 'extranet',
                },
                {
                    title: '环境',
                    dataIndex: 'env',
                    key: 'env',
                    render: (text, record) => {
                       const env = ['daily', 'beta', 'prod'] 
                       return text != null ? <span>{env[text]}</span> : '--';
                    }
                },
                {
                    title: '创建人',
                    dataIndex: 'username',
                    key: 'username',
                    width: 80
                },
                {
                    title: '创建时间',
                    dataIndex: 'add_time',
                    key: 'add_time',
                    render: (text, record) => {
                        return(
                          <span>{formatTime(text)}</span>
                        )
                    }
                },
                {
                    title: '更新时间',
                    dataIndex: 'up_time',
                    key: 'up_time',
                    render: (text, record) => {
                        return(
                          <span>{formatTime(text)}</span>
                        )
                    }
                },
                {
                    title: '备注',
                    dataIndex: 'remark',
                    key: 'remark',
                    width: 200,
                },
                {
                    title: '操作',
                    dataIndex: 'action',
                    width: 110,
                    key: 'action',
                    render: (text, record) => (
                        <span>
                          <a onClick={(e) => this.onSelectCurrentRow(e, record)}>修改</a>
                          <Divider type="vertical" />
                          <Popconfirm
                            title={`删除后不可恢复,你确定删除${record.name}?`}
                            onConfirm={ e => this.handelDelCron(e, record)}
                            okText="是"
                            cancelText="否"
                          >
                            <a>删除</a>
                          </Popconfirm>
                        </span>
                    )
                }
            ],
            captureList: [],
            pagination: {
                current: 1,
                pageSize: 10,
                total: null
            }
        };
        this.modalType = null;
        this.curRow = null;
        this.handleSubmit = this.handleSubmit.bind(this);
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.getCaptureList = this.getCaptureList.bind(this);
        this.onChangePagination = this.onChangePagination.bind(this);
        this.handelDelCron = this.handelDelCron.bind(this);
    }

    handleSubmit () {
        this.props.form.validateFields(async(err, values) => {
            if(!err) {
                const params = { ...values }
                if(this.modalType === 'add') {
                    const data = await this.props.addCapture(params)
                    message.success('新建成功');
                } else {
                    const { _id: rowId  } = this.curRow;
                    
                    await this.props.updateCapture({...params, id: rowId});
                    message.success('更新成功');
                }
                this.getCaptureList(this.state.pagination.current, this.state.pagination.pageSize);
                this.hideModal()
            }
        })
    }
    
    async getCaptureList (page, limit) {
        const data = await this.props.getCaptureList(page, limit);
        this.setState({
            captureList: data.payload.data.data.list,
        });
        const pagination = Object.assign({}, this.state.pagination,  { total:  data.payload.data.data.total })
        this.setState({
            pagination
        });
    }

    showModal (type, data) {
        this.modalType = type;
        this.setState({
            visible: true
        })
        if(type === 'add') {
            this.props.form.resetFields();
        }
        if(type === 'edit') {
     
            this.props.form.setFieldsValue({
                name: data.name,
                intranet:  data.intranet,
                extranet: data.extranet,
                env: data.env,
                remark: data.remark
            }) 
        }
    }

    hideModal () {
        this.setState({
            visible: false
        })
    }

    onSelectCurrentRow = (e, record) => {
        e.preventDefault();
        this.curRow = record;
        this.showModal('edit', record)
    }

    onChangePagination (page, pageSize) {
        const pagination = Object.assign({}, this.state.pagination,  { current:  page })
        this.setState({
            pagination
        });
        this.getCaptureList(page, this.state.pagination.pageSize);
    }

    async handelDelCron (e, record) {
        e.preventDefault();
        await this.props.delCapture(record._id);
        message.success('删除成功');
        this.getCaptureList(this.state.pagination.current, this.state.pagination.pageSize);
    }

    componentWillMount() {
        this.getCaptureList(this.state.pagination.current, this.state.pagination.pageSize);
    }
     
    render () {
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: { span: 4 },
            wrapperCol: { span: 18 }
        };
        return (
            <div className="capture-main">
                <Button type="primary" onClick={() => this.showModal('add')}>新建</Button>
                <Table 
                  dataSource={this.state.captureList} 
                  columns={this.state.columns}  
                  style={{marginTop: '15px'}} 
                  rowKey='_id'
                  pagination={{
                    'current': this.state.pagination.current, 
                    'total': this.state.pagination.total,
                    'pageSize': this.state.pagination.pageSize,
                    'onChange': this.onChangePagination
                  }}>
                </Table>
                {
                <Modal
                    title={this.modalType== 'add' ? '新增抓包服务' : '编辑抓包服务'}
                    visible={this.state.visible}
                    onOk={this.handleSubmit}
                    onCancel={this.hideModal}
                    footer={[
                        <Button key="back" onClick={this.hideModal}>
                            取消
                        </Button>,
                        <Button key="submit" type="primary" onClick={this.handleSubmit}>
                           {this.modalType === 'add' ? '新建' : '保存'}
                        </Button>
                    ]}
                    >
                    <Form>
                        <Form.Item label="服务名称"
                          {...formItemLayout}
                        >
                        {getFieldDecorator("name", {
                            rules: [{
                                required: true,
                                message: '服务名称不能为空',
                            }]
                        })(<Input />)}
                        </Form.Item>
                        <Form.Item label="内网域名"
                          {...formItemLayout}
                        >
                        {getFieldDecorator("intranet", {
                            rules: [{
                                required: true,
                                message: '内网域名不能为空',
                            }]
                        })(<Input />)}
                        </Form.Item>
                        <Form.Item label="外网域名"
                          {...formItemLayout}
                        >
                        {getFieldDecorator("extranet", {
                            rules: [{
                                required: true,
                                message: '外网域名不能为空',
                            }]
                        })(<Input />)}
                        </Form.Item>
                        <Form.Item label="服务环境"
                          {...formItemLayout}
                        >
                        {getFieldDecorator("env", {
                            rules: [{
                                required: true,
                                message: '环境不能为空', 
                            }]
                        })(
                            <Select placeholder="请选择">
                                <Select.Option value={0}>daily</Select.Option>
                                <Select.Option value={1}>beta</Select.Option>
                                <Select.Option value={2}>prod</Select.Option>
                            </Select>
                        )}
                        </Form.Item>
                        <Form.Item label="备注"
                          {...formItemLayout}
                        >
                        {getFieldDecorator("remark", {
                            rules: [{
                                required: true,
                                message: '备注不能为空',
                            }]
                        })(<Input.TextArea />)}
                        </Form.Item>
                    </Form>
                </Modal>}
            </div>
        )
    }
}

export default Form.create()(CaptureService);