import React, { PureComponent as Component } from "react";
import { Button, Table } from 'antd'; 
import { formatTime } from '../../common.js'

class CaptureService extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columns: [
                {
                    title: '服务名称',
                    dataIndex: 'name',
                    key: 'name',
                },
                {
                    title: '流量入口',
                    dataIndex: 'inlet',
                    key: 'inlet',
                },
                {
                    title: '环境',
                    dataIndex: 'env',
                    key: 'env',
                },
                {
                    title: '创建人',
                    dataIndex: 'creator',
                    key: 'creator',
                },
                {
                    title: '创建时间',
                    dataIndex: 'create_time',
                    key: 'create_time',
                },
                {
                    title: '更新时间',
                    dataIndex: 'update_time',
                    key: 'update_time',
                },
                {
                    title: '备注',
                    dataIndex: 'remark',
                    key: 'remark',
                },
                {
                    title: '操作',
                    dataIndex: 'action',
                    key: 'action',
                }
            ]
        }
    }
     
    render () {
        return (
            <div className="capture-main">
                <Button type="primary">新建</Button>
                <Table dataSource={[]} columns={this.state.columns} style={{marginTop: '15px'}}></Table>
            </div>
        )
    }
}

export default CaptureService;