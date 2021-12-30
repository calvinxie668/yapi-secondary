import React, { PureComponent as Component } from "react";
import './NavBar.scss';
import { Menu, Icon } from 'antd';
import { withRouter } from 'react-router-dom';

const { SubMenu } = Menu;

class NavBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            defaultSelectedKeys: ''
        }
    }

    handleClickMenuItem = e => {
        this.props.history.push(e.key)
    };

    UNSAFE_componentWillMount () {
        const curRoute = this.props.location.pathname;
        this.setState({
            defaultSelectedKeys: curRoute
        })
    }
    render () {
        return (
            <div className="nav-bar">
                <Menu
                    mode="inline"
                    defaultSelectedKeys={this.state.defaultSelectedKeys}
                    defaultOpenKeys={['sub1']}
                    onClick={this.handleClickMenuItem}
                >
                    <SubMenu
                      key="sub1"
                      title={
                          <span>
                              <Icon type="bank"></Icon>
                              控制台
                          </span>
                      }
                    >
                        <Menu.Item key="/capture/service">服务管理</Menu.Item>
                        <Menu.Item key="/capture/content">抓包</Menu.Item>
                    </SubMenu>
                </Menu>
            </div>
        )
    }
}

export default withRouter(NavBar);