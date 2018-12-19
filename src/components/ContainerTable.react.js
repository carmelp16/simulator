// libs


import { connect } from 'react-redux';
import { Table, Tag, Progress, notification, Icon, Button } from 'antd';
import { createSelector } from 'reselect';
import React, { Component } from 'react';
import Moment from 'react-moment';
import PropTypes from 'prop-types';
import { withState } from 'recompose';
import { openModal } from '../actions/modal.action';
import { init } from '../actions/containerTable.action';
import TabSwitcher from './TabSwitcher';
import { getData } from '../actions/jaegerGetData.action';
import { CopyToClipboard } from 'react-copy-to-clipboard';
const RECORD_STATUS = {
  active: '#2db7f5',
  completed: '#87d068',
  failed: '#f50',
  stopped: '#ec8c16',
  succeed: '#87d068',
  creating: '#838383',
  skipped: '#eeda13',
  //creating:'#108ee9'
};

class ContainerTable extends Component {
  componentWillMount() {
    this.props.init();

    const sorter = (a, b) => {
      let tempA = null;
      let tempB = null;
      tempA = a || '';
      tempB = b || '';
      return tempA.localeCompare(tempB);
    };
    this.columns = [
      {
        title: 'Job ID',
        dataIndex: 'key',
        key: 'key',
        width: '25%',
        sorter: (a, b) => sorter(a.key, b.key),
        render: (text, record) =>
          <CopyToClipboard text={`${record.key}`} onCopy={() => notification.success({
            message: 'Copied to clipboard',
            description: ``
          })}>

            <div>
              <Icon type="right" style={{ color: 'rgba(187, 180, 180, 0.75)', marginRight: '10px' }} />
              {`${record.key.substring(0, 35)} ...`}
            </div>

          </CopyToClipboard>

      },
      {
        title: 'Pipeline Name',
        dataIndex: 'status.pipeline',
        key: 'pipeline',
        width: '10%',
        onFilter: (value, record) => record.key.includes(value),
        sorter: (a, b) => sorter(a.key, b.key)
      },
      {
        title: 'Status',
        dataIndex: 'status.status',
        width: '5%',
        key: 'status',
        render: (text, record) => (<span>
          <Tag color={RECORD_STATUS[record.status && record.status.status]}>{record.status && record.status.status}</Tag>
        </span>
        ),
        sorter: (a, b) => sorter(a.status.status, b.status.status)
      },
      {
        title: 'Start time',
        dataIndex: 'status.timestamp',
        key: 'Start timestamp',
        width: '15%',
        sorter: (a, b) => sorter(a.timestamp, b.timestamp),
        render: (text, record) =>
          (<span>
            <Moment format="DD/MM/YY hh:mm:ss">
              {record.pipeline.startTime}
            </Moment>
          </span>
          )
      },

      {
        title: 'Running time',
        dataIndex: 'status.timestamp',
        key: 'timestamp',
        width: '15%',
        // sorter: (a, b) => sorter(a.timestamp, b.timestamp),
        render: (text, record) => {
          let runningTime = record.results && record.results.timeTook ? record.results.timeTook : Date.now() - record.pipeline.startTime
          let timeTook =  record.results && record.results.timeTook ?  record.results.timeTook :null;
          return (<span>{
            record.results ?
              // <Moment>
              <span>
                {record.results.timeTook+ " Seconds"}
                </span>
          //    </Moment> 
              :
               <Moment date={record.pipeline.startTime}
                durationFromNow
              />
          }
          </span>
          )
        }

      },
      {
        title: 'Description',
        dataIndex: 'status.data.details',
        key: 'details',
        width: '10%',
        render: (text, record) => {
          let statuses = Object.entries(record.status.data.states.asMutable()).map(s => <Tag color={RECORD_STATUS[s[0]] || 'magenta'}>{s[1]}</Tag>)
          return (<span>
            {statuses}
          </span>
          )
        }
      },
      {
        title: 'Progress',
        dataIndex: 'Progress',
        width: '30%',
        key: 'y',
        render: (text, record) => {
          let progress = (record.status && record.status.data && record.status.data.progress) || 0;
          const stopped = (record.status && record.status.status === 'stopped');
          const failed = (record.status && record.status.status === 'failed');
          progress = parseInt(progress);
          if (progress === 100) {
            return (<span>
              <Progress percent={progress} status={stopped || failed ? 'exception' : 'success'} strokeColor={failed ? '#f50' : stopped ? 'orange' : null} />
            </span>);
          }
          return (<span>
            <Progress percent={progress} status={stopped || failed ? 'exception' : 'active'} strokeColor={failed ? '#f50' : stopped ? 'orange' : null} />
          </span>);
        },
        // sorter: (a, b) => sorter(a.status.data.progress, b.status.data.progress)
      },
      {
        title: '',
        dataIndex: '',
        key: 'stop',
        width: '5%',
        render: (text, record) => {
          //let progress = (record.status && record.status.data && record.status.data.progress) || 0;
          const actionButton = record.status.status === 'active' ?
            <Button type="danger" shape="circle" icon="close" onClick={() => this.onDelete(record.key)} /> :
            <Button type="default" shape="circle" icon="redo" onClick={() => this.onDelete(record.key)} />;
          return (actionButton)
        }
      }

    ];
  }


  stopPipeline(jobId) {

  }
  renderColumns() {

  }

  render() {
    const { dataSource } = this.props;
    return (
      <div>
        <Table
          columns={this.columns}
          dataSource={dataSource.asMutable()}
          pagination={{
            defaultCurrent: 1, pageSize: 15
          }}
          locale={{ emptyText: 'no data' }}
          expandedRowRender={(record) => (
            <TabSwitcher record={{
              key: record.key,
              graph: record.graph,
              record: {
                pipeline: record.pipeline,
                status: record.status,
                results: record.results
              },
              jaeger: (this.props.jaeger[record.key] || null)
            }} />
          )}
          onExpand={(expanded, record) => {
            if (expanded) {
              this.props.getData(record.key);
            }
          }} />
      </div>
    );
  }

}


const containerTable = (state) => state.containerTable.dataSource;
const autoCompleteFilter = (state) => state.autoCompleteFilter.filter;

const tableDataSelector = createSelector(
  containerTable,
  autoCompleteFilter,
  (containerTable) => containerTable
);

ContainerTable.propTypes = {
  dataSource: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  dataSource: tableDataSelector(state),
  jaeger: state.jaeger,
  scriptsPath: state.serverSelection.currentSelection.scriptsPath,
  sshUser: state.serverSelection.currentSelection.user
});

export default connect(mapStateToProps, { openModal, init, getData })(
  withState('isVisible', 'onPopoverClickVisible', { visible: false, podName: '' })(ContainerTable)
);
