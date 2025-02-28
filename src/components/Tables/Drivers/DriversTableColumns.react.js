import React from 'react';
import { Tag } from 'antd';
import { COLOR_PIPELINE_STATUS } from 'styles/colors';
import { sorter } from 'utils/string';
import Ellipsis from 'components/common/Ellipsis.react';

const driversTableColumns = () => [
  {
    title: 'Pipeline',
    dataIndex: 'pipelineName',
    key: 'pipelineName',
    width: '20%',
    sorter: (a, b) => sorter(a.pipelineName, b.pipelineName),
    render: pipelineName => (
      <Ellipsis
        type={!pipelineName && 'warning'}
        length={30}
        text={pipelineName || 'Not Assigned'}
      />
    )
  },
  {
    title: 'Job ID',
    dataIndex: 'jobId',
    key: 'jobId',
    width: '20%',
    sorter: (a, b) => sorter(a.jobId, b.jobId),
    render: jobId => <Ellipsis length={30} copyable text={jobId} />
  },
  {
    title: 'Pod Name',
    dataIndex: 'podName',
    key: 'podName',
    width: '20%',
    onFilter: (value, record) => record.podName.includes(value),
    sorter: (a, b) => sorter(a.podName, b.podName),
    render: podName => <Ellipsis copyable length={30} text={podName} />
  },
  {
    title: 'Driver State',
    dataIndex: 'driverStatus',
    key: 'driverStatus',
    render: driverStatus => <Tag color={COLOR_PIPELINE_STATUS[driverStatus]}>{driverStatus}</Tag>,
    sorter: (a, b) => sorter(a.driverStatus, b.driverStatus)
  },
  {
    title: 'Job State',
    dataIndex: 'jobStatus',
    key: 'jobStatus',
    render: jobStatus => <Tag color={COLOR_PIPELINE_STATUS[jobStatus]}>{jobStatus}</Tag>,
    sorter: (a, b) => sorter(a.jobStatus, b.jobStatus)
  },
  {
    title: 'Paused',
    dataIndex: 'paused',
    key: 'paused',
    render: paused => <Tag color={paused ? 'red' : 'green'}>{paused ? 'paused' : 'ready'}</Tag>,
    sorter: (a, b) => sorter(a.paused, b.paused)
  }
];

export default driversTableColumns;
