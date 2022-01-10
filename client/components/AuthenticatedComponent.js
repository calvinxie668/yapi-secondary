import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { changeMenuItem } from '../reducer/modules/menu';
import { withRouter } from 'react-router-dom';
import momnet from 'moment';
let timer = null;

export function requireAuthentication(Component) {
  return @connect(
    state => ({
      isAuthenticated: state.user.isLogin,
      // ws: state.other.ws
    }),
    {
      changeMenuItem
    }
  )
  @withRouter
  class AuthenticatedComponent extends React.PureComponent {
    constructor(props) {
      super(props);
    }
    static propTypes = {
      isAuthenticated: PropTypes.bool,
      location: PropTypes.object,
      dispatch: PropTypes.func,
      history: PropTypes.object,
      changeMenuItem: PropTypes.func
    };

    startCountTime = (date) => {
      let diffTime = ''
      timer = setInterval(() =>{
          diffTime = momnet().diff(momnet(date), 'second');
          console.log(diffTime)
          if(diffTime > 3) {
            console.log('close ws')
            // this.props.ws.onclose();
            clearInterval(timer)
          }
      }, 1000)
  }

  componentDidMount () {
      // 路由守卫
      // this.unListen = this.props.history.listen((location, action) => {
      //   console.log('from', this.props.location)
      //   const prevLocation = this.props.location;
      //   console.log('to', location)
      //   if(location.pathname && timer) {
      //     clearInterval(timer)
      //   }
      //   window.addEventListener('visibilitychange', () => {
      //       if(document.visibilityState === 'hidden' && window.location.href.indexOf('/capture/content') > -1) {
      //           console.log('离开')
      //           const date = new Date();
      //           if(timer){
      //             clearInterval(timer)
      //           }
      //           this.startCountTime(date)
      //       }
      //       if(document.visibilityState === 'visible') {
      //           console.log('回来');
      //           if(window.location.href.indexOf('/capture/content') > -1) {
      //               clearInterval(timer)
      //           }
      //       }
      //   })
      // })
    }

    UNSAFE_componentWillMount() {
      this.checkAuth();
    }

    // componentWillUnmount() {
    //   this.unListen();
    //   window.removeEventListener('visibilitychange', () => {
    //     console.log('移除visibilitychange')
    //   })
    // }
    UNSAFE_componentWillReceiveProps() {
      this.checkAuth();
    }
    checkAuth() {
      if (!this.props.isAuthenticated) {
        this.props.history.push('/');
        this.props.changeMenuItem('/');
      }
    }
    render() {
      return <Fragment>{this.props.isAuthenticated ? <Component {...this.props} /> : null}</Fragment>
    }
  };
}
