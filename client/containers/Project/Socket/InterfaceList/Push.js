import React, { PureComponent as Component } from 'react';
import { Row, Col, Button,  Input, Form, message } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import { formatTime } from '../../../../common.js';
import { withRouter } from 'react-router-dom';
import AceEditor from 'client/components/AceEditor/AceEditor';
const FormItem = Form.Item;

class socketPush  extends Component {
    static propTypes = {
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
        } 
    };

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
			let interfaceId = this.props.match.params.actionId;
			this.getOncePushData(interfaceId)
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
            <div>
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
          </div>  
        )
    }
}

export default Form.create()(withRouter(socketPush));