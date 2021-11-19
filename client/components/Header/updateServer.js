import React, { PureComponent as Component } from 'react';
import { Modal, Select, notification, message }  from 'antd';
import axios from 'axios';
const axiosInst = axios.create({
    timeout: 5 * 60 * 1000
})

const { Option } = Select;

class UpdateServer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            type: 'pull_server'
        }
        
    }
    handleCancel = () => {
       this.props.close();
    }

    handleSelected = (value) => {
        console.log(value)
        this.setState({
            type: value
        })
    }

    handleOk = () => {
        notification['info']({
            message: 'mock服务正在更新重启中...',
            duration: null,
            description:
              '因后端server_mock服务pb类需拉取代码编译耗时在十分钟之内,请耐心等待服务重启成功后再进行socket接口的mock',
          });
        this.props.close();
        axiosInst({
            url: '/api/mock/manager/update',
            method: 'get',
           params: {
            serverName: this.state.type
           },
           timeout: 0
        }).then(res => {
            notification.destroy();
            if(res.data.status) {
                message.success('mock服务重启成功');
            } else {
                message.error('mock服务重启失败');
            }
        }).catch(err => {
            console.log(err)
        })
    }

   render () {
       return (
           <div>
               <Modal
                 title="更新mock服务"
                 visible={this.props.visible}
                 onCancel={this.handleCancel}
                 onOk={this.handleOk}
               >
                   <Select defaultValue="pull_server" onChange={this.handleSelected}>
                       <Option value="pull_server">pull_server</Option>
                       <Option value="push_server">push_server</Option>
                   </Select>
               </Modal>
           </div>
       )
   }
}

export default UpdateServer;

