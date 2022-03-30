import React, { PureComponent as Component } from 'react';
import { Drawer, Form, Row, Col, Input, Select, DatePicker, Button } from 'antd';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { values } from 'underscore';
const { Option } = Select;
const { RangePicker } = DatePicker;

class CronFilter extends Component {
	constructor(ctx) {
		super(ctx);
		this.state = {
			searchValue: []
		}
	}

	handleSearchUser = (value) => {
		axios.get('/api/user/search', {
			params: {
				q: value
			}
		}).then(res => {
			if(res.data.data && res.data.data.length) {
				this.setState({searchValue: res.data.data})
			}

		}).catch(err=>{})
	}

	handelSubmitFilter = (e) => {
		e.preventDefault();
		let _this = this;
		this.props.form.validateFields((err, values) => {
			if(!err) {
				let { add_time } = values;
				add_time = add_time && add_time.map(item => item.format('YYYY-MM-DD')).map(d => new Date(d).getTime()/1000)
				values.add_time = add_time
				_this.props.filter(values)
			}
		}) 
	}

	handleClose = () => {
		this.props.onClose()
	}

	render() {
		const { getFieldDecorator } = this.props.form;
		const formItemLayout = {
			labelCol: {
				sm: { span: 4 }
			},
			wrapperCol: {
				sm: { span: 16 }
			}
		};
		return(
			<Drawer
				title="高级筛选"
				width={640}
				visible={this.props.filterVisible}
				onClose={this.handleClose}
			>
				<Form onSubmit={e=>this.handelSubmitFilter(e)}>
					<Row gutter={[0, 12]}>
						<Col span={24}>
							<Form.Item label="任务名称" {...formItemLayout}>
								{
									getFieldDecorator('name')(<Input placeholder='填写任务名称'/>)
								}
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={[0, 12]}>
						<Col span={24}>
							<Form.Item label="股票代码" {...formItemLayout}>
								{
									getFieldDecorator('stock_codes')(<Input placeholder='填写股票代码'/>)
								}
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={[0, 12]}>
						<Col span={24}>
							<Form.Item label="状态" {...formItemLayout}>
								{
									getFieldDecorator('status')
									(
										<Select placeholder="选择状态" allowClear>
											<Option value={0}>未开启</Option>
											<Option value={1}>推送中</Option>
											<Option value={-1}>推送失败</Option>
										</Select>
									)
								}
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={[0, 12]}>
						<Col span={24}>
							<Form.Item label="创建人" {...formItemLayout}>
								{
									getFieldDecorator('uid')(
										<Select 
											placeholder="选择创建人"
											showSearch
											showArrow={false}
        							filterOption={false}
											notFoundContent={null}
											defaultActiveFirstOption={false}
											onSearch={this.handleSearchUser}
										>
										{this.state.searchValue.map(d => {
											return <Option key={d.uid}>{d.username}</Option>
										})}	
										</Select>
									)
								}
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={[0, 12]}>
						<Col span={24}>
							<Form.Item label="创建时间" {...formItemLayout}>
								{
									getFieldDecorator('add_time')(
										<RangePicker/>
									)
								}
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col span={4} offset={4}>
							<Button type="primary" onClick={e=> this.handelSubmitFilter(e)}>筛选</Button>
						</Col>
					</Row>
				</Form>
			</Drawer>
		)
	}
}

export default  Form.create()(withRouter(CronFilter));