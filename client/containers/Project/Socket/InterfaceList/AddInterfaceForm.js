import React, {Fragment, PureComponent as Component } from 'react'
import PropTypes from 'prop-types'
import { Form, Input, Select, Button } from 'antd';

import constants from '../../../../constants/variable.js'
import { handleApiPath, nameLengthLimit } from '../../../../common.js'
const SOCKET_METHOD = constants.SOCKET_METHOD;
// const HTTP_METHOD_KEYS = Object.keys(HTTP_METHOD);

const FormItem = Form.Item;
const Option = Select.Option;
function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}


class AddInterfaceForm extends Component {
  constructor() {
    super()
    this.state = {
      placeholder: '请填写RequestMsgType',
    }
  }
  static propTypes = {
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    catid: PropTypes.number,
    catdata: PropTypes.array
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSubmit(values, () => {
          this.props.form.resetFields();
        });

      }
    });
  }

  handlePath = (e) => {
    let val = e.target.value
    this.props.form.setFieldsValue({
      path: handleApiPath(val)
    })
  }

  handleChange = (val) => {
    const placeholder =  val == 'PULL' ? '请填写RequestMsgType' : '请填写TopicId'
    this.setState({
      placeholder
    })
  }
  render() {
    const { getFieldDecorator, getFieldsError, getFieldValue } = this.props.form;
    // const prefixSelector = getFieldDecorator('method', {
    //   initialValue: 'PULL'
    // })(
    //   <Select style={{ width: 75 }} onChange={this.handleChange}>
    //     {SOCKET_METHOD.map(item => {
    //       return <Option key={item} value={item}>{item}</Option>
    //     })}
    //   </Select>
    //   );
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };


    return (
      <Form onSubmit={this.handleSubmit}>
        <FormItem
          {...formItemLayout}
          label="接口分类"
        >
          {getFieldDecorator('catid', {
            initialValue: this.props.catid ? this.props.catid + '' : this.props.catdata[0]._id + ''
          })(
            <Select>
              {this.props.catdata.map(item => {
                return <Option key={item._id} value={item._id + ""}>{item.name}</Option>
              })}
            </Select>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="接口类型"
        >
          {
            getFieldDecorator('method', {
              initialValue: 'PULL'
            })(
              <Select>
              {SOCKET_METHOD.map(item => {
                  return <Option key={item} value={item}>{item}</Option>
              })}
              </Select>
            )
          }
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="接口名称"
        >
          {getFieldDecorator('title', {
            rules: nameLengthLimit('接口')
          })(
            <Input placeholder="接口名称" />
            )}
        </FormItem>
{/* 
        <FormItem
          {...formItemLayout}
          label="接口类型"
        >
          {getFieldDecorator('path', {
            rules: [{
              required: true, message: '请输入接口类型!'
            }]
          })(
            <Input onBlur={this.handlePath}  addonBefore={prefixSelector} placeholder={this.state.placeholder} />
            )}
        </FormItem> */}
        {
          getFieldValue('method') === 'PULL' ? 
          <Fragment>
            <FormItem
              {...formItemLayout}
              label="请求消息类型"
            >
              {getFieldDecorator('req_msg_type', {
                rules: [{
                  required: true, message: '请输入请求消息类型!'
                }]
              })(
                <Input placeholder="请求消息类型" />
                )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="请求PB数据实体"
            >
              {getFieldDecorator('req_msg_body', {
                rules: [{
                  required: true, message: '请输入请求PB数据实体!'
                }]
              })(
                <Input placeholder="请求PB数据实体" />
                )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="返回结果消息类型"
            >
              {getFieldDecorator('res_msg_type', {
                rules: [{
                  required: true, message: '请输入返回结果消息类型!'
                }]
              })(
                <Input placeholder="返回结果消息类型" />
                )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="返回结果消息实体"
            >
              {getFieldDecorator('res_msg_body', {
                rules: [{
                  required: true, message: '请输入返回结果消息类型!'
                }]
              })(
                <Input placeholder="返回结果消息实体" />
                )}
            </FormItem>
        </Fragment> :
        <Fragment>
           <FormItem
            {...formItemLayout}
            label="topicId"
          >
            {getFieldDecorator('topicId', {
              rules: [{
                required: true, message: '请输入topicId!'
              }]
            })(
              <Input placeholder="topicId" />
              )}
          </FormItem>
           <FormItem
            {...formItemLayout}
            label="推送消息类型"
          >
            {getFieldDecorator('push_msg_type', {
              rules: [{
                required: true, message: '请输入推送消息类型!'
              }]
            })(
              <Input placeholder="推送消息类型" />
              )}
          </FormItem>
           <FormItem
            {...formItemLayout}
            label="推送数据实体"
          >
            {getFieldDecorator('push_msg_body', {
              rules: [{
                required: true, message: '请输入推送数据实体!'
              }]
            })(
              <Input placeholder="推送数据实体" />
              )}
          </FormItem>
        </Fragment>
        }
       
        <FormItem
          {...formItemLayout}
          label="注"
        >
          <span style={{ color: "#929292" }}>详细的接口数据可以在编辑页面中添加</span>
        </FormItem>
        <FormItem className="catModalfoot" wrapperCol={{ span: 24, offset: 8 }} >
          <Button onClick={this.props.onCancel} style={{ marginRight: "10px" }}  >取消</Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={hasErrors(getFieldsError())}
          >
            提交
          </Button>
        </FormItem>

      </Form>

    );
  }
}

export default Form.create()(AddInterfaceForm);
