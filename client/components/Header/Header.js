import './Header.scss';
import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon, Layout, Menu, Dropdown, message, Tooltip, Popover, Tag } from 'antd';
import { checkLoginState, logoutActions, loginTypeAction } from '../../reducer/modules/user';
import { changeMenuItem } from '../../reducer/modules/menu';
import { withRouter } from 'react-router';
import Srch from './Search/Search';
import UpServer from './updateServer'
const { Header } = Layout;
import LogoSVG from '../LogoSVG/index.js';
import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import GuideBtns from '../GuideBtns/GuideBtns.js';
const plugin = require('client/plugin.js');

let HeaderMenu = {
  user: {
    path: '/user/profile',
    name: '个人中心',
    icon: 'user',
    adminFlag: false
  },
  solution: {
    path: '/user/list',
    name: '用户管理',
    icon: 'solution',
    adminFlag: true
  }
};

plugin.emitHook('header_menu', HeaderMenu);

const MenuUser = props => (
  <Menu theme="dark" className="user-menu">
    {Object.keys(HeaderMenu).map(key => {
      let item = HeaderMenu[key];
      const isAdmin = props.role === 'admin';
      if (item.adminFlag && !isAdmin) {
        return null;
      }
      return (
        <Menu.Item key={key}>
          {item.name === '个人中心' ? (
            <Link to={item.path + `/${props.uid}`}>
              <Icon type={item.icon} />
              {item.name}
            </Link>
          ) : (
            <Link to={item.path}>
              <Icon type={item.icon} />
              {item.name}
            </Link>
          )}
        </Menu.Item>
      );
    })}
    <Menu.Item key="9">
      <a onClick={props.logout}>
        <Icon type="logout" />退出
      </a>
    </Menu.Item>
  </Menu>
);

const tipFollow = (
  <div className="title-container">
    <h3 className="title">
      <Icon type="star" /> 关注
    </h3>
    <p>这里是你的专属收藏夹，便于你找到自己的项目</p>
  </div>
);

const tipCapture = (
  <div className="title-container">
    <h3 className="title">
      <Icon type="bug" /> 抓包
    </h3>
    <p>这里是socket接口抓包工具, 便于你分析数据</p>
  </div>
);

const tipUpService = (
  <div className="title-container">
    <h3 className="title">
      <Icon type="sync" /> 更新mock服务
    </h3>
    <p>当mock后端服务更新PB文件时，可手动触发重启mock服务</p>
  </div>
);
const tipAdd = (
  <div className="title-container">
    <h3 className="title">
      <Icon type="plus-circle" /> 新建项目
    </h3>
    <p>在任何页面都可以快速新建项目</p>
  </div>
);
const tipDoc = (
  <div className="title-container">
    <h3 className="title">
      使用文档 <Tag color="orange">推荐!</Tag>
    </h3>
    <p>
      初次使用 YApi，强烈建议你阅读{' '}
      <a target="_blank" href="https://hellosean1025.github.io/yapi/" rel="noopener noreferrer">
        使用文档
      </a>
      ，我们为你提供了通俗易懂的快速入门教程，更有详细的使用说明，欢迎阅读！{' '}
    </p>
  </div>
);

MenuUser.propTypes = {
  user: PropTypes.string,
  msg: PropTypes.string,
  role: PropTypes.string,
  uid: PropTypes.number,
  relieveLink: PropTypes.func,
  logout: PropTypes.func
};

const ToolUser = props => {
  let imageUrl = props.imageUrl ? props.imageUrl : `/api/user/avatar?uid=${props.uid}`;
  return (
    <ul>
      <li className="toolbar-li item-search">
        <Srch groupList={props.groupList} />
      </li>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns />}
        title={tipCapture}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 1 && !props.study}
      >
      <Tooltip placement="bottom" title={'socket抓包'}>
        <li className="toolbar-li">
          <Link to="/capture/content">
            <Icon className="dropdown-link" style={{ fontSize: 16 }} type="bug" />
          </Link>
        </li>
      </Tooltip>
      </Popover>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns />}
        title={tipFollow}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 2 && !props.study}
      >
        <Tooltip placement="bottom" title={'我的关注'}>
          <li className="toolbar-li">
            <Link to="/follow">
              <Icon className="dropdown-link" style={{ fontSize: 16 }} type="star" />
            </Link>
          </li>
        </Tooltip>
      </Popover>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns />}
        title={tipAdd}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 3 && !props.study}
      >
        <Tooltip placement="bottom" title={'新建项目'}>
          <li className="toolbar-li">
            <Link to="/add-project">
              <Icon className="dropdown-link" style={{ fontSize: 16 }} type="plus-circle" />
            </Link>
          </li>
        </Tooltip>
      </Popover>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns />}
        title={tipDoc}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 4 && !props.study}
      >
        <Tooltip placement="bottom" title={'使用文档'}>
          <li className="toolbar-li">
            <a target="_blank" href="https://hellosean1025.github.io/yapi" rel="noopener noreferrer">
              <Icon className="dropdown-link" style={{ fontSize: 16 }} type="question-circle" />
            </a>
          </li>
        </Tooltip>
      </Popover>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns isLast={true} />}
        title={tipUpService}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 5 && !props.study}
      >
      <Tooltip placement="bottom" title={'更新mock服务'}>
          <li className="toolbar-li">
              <Icon className="dropdown-link" style={{ fontSize: 16 }} type="sync" onClick={props.upServerVisible}/>
          </li>
        </Tooltip>
      </Popover>
      
      <li className="toolbar-li">
        <Dropdown
          placement="bottomRight"
          trigger={['click']}
          overlay={
            <MenuUser
              user={props.user}
              msg={props.msg}
              uid={props.uid}
              role={props.role}
              relieveLink={props.relieveLink}
              logout={props.logout}
            />
          }
        >
          <a className="dropdown-link">
            <span className="avatar-image">
              <img src={imageUrl} />
            </span>
            {/*props.imageUrl? <Avatar src={props.imageUrl} />: <Avatar src={`/api/user/avatar?uid=${props.uid}`} />*/}
            <span className="name">
              <Icon type="down" />
            </span>
          </a>
        </Dropdown>
      </li>
    </ul>
  );
};
ToolUser.propTypes = {
  user: PropTypes.string,
  msg: PropTypes.string,
  role: PropTypes.string,
  uid: PropTypes.number,
  relieveLink: PropTypes.func,
  logout: PropTypes.func,
  groupList: PropTypes.array,
  studyTip: PropTypes.number,
  study: PropTypes.bool,
  imageUrl: PropTypes.any
};

@connect(
  state => {
    return {
      user: state.user.userName,
      uid: state.user.uid,
      msg: null,
      role: state.user.role,
      login: state.user.isLogin,
      studyTip: state.user.studyTip,
      study: state.user.study,
      imageUrl: state.user.imageUrl
    };
  },
  {
    loginTypeAction,
    logoutActions,
    checkLoginState,
    changeMenuItem
  }
)
@withRouter
export default class HeaderCom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false
    }
  }

  static propTypes = {
    router: PropTypes.object,
    user: PropTypes.string,
    msg: PropTypes.string,
    uid: PropTypes.number,
    role: PropTypes.string,
    login: PropTypes.bool,
    relieveLink: PropTypes.func,
    logoutActions: PropTypes.func,
    checkLoginState: PropTypes.func,
    loginTypeAction: PropTypes.func,
    changeMenuItem: PropTypes.func,
    history: PropTypes.object,
    location: PropTypes.object,
    study: PropTypes.bool,
    studyTip: PropTypes.number,
    imageUrl: PropTypes.any
  };

  handleShowModal = () => {
    this.setState({
      visible: true
    })
  };

  handleCloseModal = () => {
    this.setState({
      visible: false
    })
  }

  linkTo = e => {
    if (e.key != '/doc') {
      this.props.changeMenuItem(e.key);
      if (!this.props.login) {
        message.info('请先登录', 1);
      }
    }
  };
  relieveLink = () => {
    this.props.changeMenuItem('');
  };
  logout = e => {
    e.preventDefault();
    this.props
      .logoutActions()
      .then(res => {
        if (res.payload.data.errcode == 0) {
          this.props.history.push('/');
          this.props.changeMenuItem('/');
          message.success('退出成功! ');
        } else {
          message.error(res.payload.data.errmsg);
        }
      })
      .catch(err => {
        message.error(err);
      });
  };
  handleLogin = e => {
    e.preventDefault();
    this.props.loginTypeAction('1');
  };
  handleReg = e => {
    e.preventDefault();
    this.props.loginTypeAction('2');
  };
  checkLoginState = () => {
    this.props.checkLoginState
      .then(res => {
        if (res.payload.data.errcode !== 0) {
          this.props.history.push('/');
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  render() {
    const { login, user, msg, uid, role, studyTip, study, imageUrl } = this.props;
    return (
      <Header className="header-box m-header">
        <div className="content g-row">
          <Link onClick={this.relieveLink} to="/group" className="logo">
            <div className="href">
              <span className="img">
                <LogoSVG length="32px" />
              </span>
            </div>
          </Link>
          <Breadcrumb />
          <div
            className="user-toolbar"
            style={{ position: 'relative', zIndex: this.props.studyTip > 0 ? 3 : 1 }}
          >
            {login ? (
              <ToolUser
                {...{ studyTip, study, user, msg, uid, role, imageUrl }}
                relieveLink={this.relieveLink}
                logout={this.logout}
                upServerVisible={this.handleShowModal}
              />
            ) : (
              ''
            )}
          </div>
          <UpServer visible={this.state.visible} close={this.handleCloseModal}/>
        </div>
      </Header>
    );
  }
}
