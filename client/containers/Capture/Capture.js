import React, { PureComponent as Component } from 'react';
import './Capture.scss'
import Content from './CaptureContent.js';
import Service from './CaptureService.js';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setBreadcrumb } from '../../reducer/modules/user';
import NavBar from './NavBar.js';
import { Route, Switch} from 'react-router-dom';
import { requireAuthentication } from '../../components/AuthenticatedComponent';
import { renderRoutes } from '../../common.js'

let ws = null;

@connect(
    state => {
        return {

        }
    },
    {
      setBreadcrumb
    }
)
class Capture extends Component {

    static propTypes = {
        setBreadcrumb: PropTypes.func,
      };
    
    constructor(props) {
        super(props)

    }

		UNSAFE_componentWillMount() {
        this.props.setBreadcrumb([{ name: 'socket抓包' }]);
		}
    render () {
        return (
            <div className="warpper">
                <NavBar></NavBar>
                {/* <Switch>
                    <Route path="/capture/service" component={requireAuthentication(Service)}>
                    </Route>
                    <Route path="/capture/content" component={requireAuthentication(Content)}>
                    </Route>
                </Switch> */}
                {
                    renderRoutes(this.props.routes || [])
                }
            </div>
        )
    }
}

export default Capture;
