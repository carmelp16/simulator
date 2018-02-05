import { handleActions } from 'redux-actions';
import dateformat from 'dateformat';
import Immutable from 'seamless-immutable';
import actions from '../constants/actions';

const dataSource = [];

const tmp = { dataSource };
// columns


const inititalState = Immutable.from(tmp);

export default handleActions({
  [actions.UPDATE_ROW_DATA_TABLE](state, { type, payload, meta, error }) {
    const timedData = payload.jobs.map((d) => {
      if (d.status) {
        d.status.timestamp = dateformat(d.status.timestamp, 'd/mm/yy, HH:MM:ss');
        return d;
      }
    });
    return state.merge({ dataSource: timedData });
  }

}, inititalState);
