import { connect } from 'react-redux';
import {
  Table,
  Card,
  Button,
  Row,
  Col,
  Modal,
  Icon,
  Tag,
  Tooltip,
  Switch,
  Input,
  Popover,
  notification,
  Badge
} from 'antd';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import cronstrue from 'cronstrue';
import cronParser from 'cron-parser';

import { init } from '../../../actions/storedPipes.action';
import { openModal } from '../../../actions/modal.action';
import {
  execStoredPipe,
  deleteStoredPipeline,
  updateStoredPipeline,
  cronStart,
  cronStop
} from '../../../actions/storedPipes.action';
import { addPipe } from '../../../actions/addPipe.action';
import './StoredPipesTable.scss';
import HEditor from '../HEditor.react';
import AddButton from '../../dumb/AddButton.react';
import { RECORD_STATUS } from '../../../constants/colors';
import { ReactComponent as PlayIconSvg } from '../../../images/play-icon.svg';
import template from '../../stubs/json-object.json';

const { Column } = Table;
class StoredPipesTable extends Component {
  componentDidMount() {
    this.props.init();
  }

  renderColumns() { }

  render() {
    const { dataSource, dataStats } = this.props;

    // Need to remove "nodes" key from each pipeline.
    const fixedDataSource = [];
    dataSource.forEach(p => {
      const pipe = JSON.parse(JSON.stringify(p));
      delete pipe.nodes;
      fixedDataSource.push(pipe);
    });

    const deleteConfirmAction = (action, record) => {
      Modal.confirm({
        title: 'WARNING Deleting Pipeline',
        content: `Are you sure you want to delete ${
          record.name
          }? Deleting Pipeline will Stop-ALL related Jobs and Executions`,
        okText: 'Confirm',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          action(record.name);
        },
        onCancel() { }
      });
    };

    const revertCronTrigger = (record, cronStart, cronStop, updateAction) => {
      return () => {
        const pipelineName = record.name;
        const hasCronProperty =
          !record.hasOwnProperty('triggers') ||
          (record.hasOwnProperty('triggers') && !record.triggers.hasOwnProperty('cron'));

        if (hasCronProperty) {
          record['triggers'] = {
            cron: {
              pattern: '0 * * * *',
              enabled: true
            },
            ...record['triggers']
          };
          updateAction(record);
        }
        record.triggers.cron.enabled ? cronStop(pipelineName) : cronStart(pipelineName);
      };
    };

    const updateCronPattern = (pipeline, pattern, updateStoredPipeline) => {
      try {
        cronstrue.toString(pattern);
        pipeline.triggers.cron.pattern = pattern;
        updateStoredPipeline(pipeline);
      } catch (errorMessage) {
        notification.config({
          placement: 'bottomRight'
        });
        notification.open({
          message: 'Cron Job Error',
          description: errorMessage,
          icon: <Icon type="warning" style={{ color: 'red' }} />
        });
      }
    };

    return (
      <div>
        <Table
          rowKey="name"
          dataSource={dataSource.asMutable()}
          pagination={{
            className: 'tablePagination',
            defaultCurrent: 1,
            pageSize: 15,
            hideOnSinglePage: true
          }}
          expandedRowRender={record => (
            <Card title="Full details">
              <ReactJson
                name={false}
                src={record}
                displayDataTypes={false}
                displayObjectSize={false}
                iconStyle="triangle"
                indentWidth="4"
                collapsed="2"
                enableClipboard={false}
              />
            </Card>
          )}
        >
          <Column title="Pipeline Name" dataIndex="name" key="name" />
          <Column
            title="Cron Job"
            dataIndex="cron"
            key="cron"
            render={(_, record) => {
              const cronIsEnabled =
                record.hasOwnProperty('triggers') &&
                record.triggers.hasOwnProperty('cron') &&
                record.triggers.cron.enabled;

              const cronExpr = cronIsEnabled ? record.triggers.cron.pattern : '0 * * * *';

              const interval = cronParser.parseExpression(cronExpr);

              return (
                <Row type="flex" justify="start">
                  <Col span={4} order={1}>
                    <Switch
                      checked={cronIsEnabled}
                      onChange={revertCronTrigger(
                        JSON.parse(JSON.stringify(record)),
                        this.props.cronStart,
                        this.props.cronStop,
                        this.props.updateStoredPipeline
                      )}
                    />
                  </Col>
                  <Col span={8} order={2}>
                    <Popover
                      content={`${cronstrue.toString(cronExpr, {
                        use24HourTimeFormat: true
                      })}, Next Interval: ${interval.next().toString()}`}
                      trigger="focus"
                    >
                      <Input.Search
                        className="cronInput"
                        size="small"
                        disabled={!cronIsEnabled}
                        placeholder="Cron Expression"
                        enterButton={<Icon type="check" />}
                        defaultValue={cronExpr}
                        onSearch={pattern =>
                          updateCronPattern(
                            JSON.parse(JSON.stringify(record)),
                            pattern,
                            this.props.updateStoredPipeline
                          )
                        }
                      />
                    </Popover>
                  </Col>
                </Row>
              );
            }}
          />
          <Column
            title="Status"
            dataIndex="status"
            key="status"
            render={(_, record) => {
              if (!dataStats || dataStats.length === 0) {
                return;
              }

              const pipelineStats = [].concat(
                ...[
                  ...dataStats
                    .filter(status => status.name === record.name && status.stats.length !== 0)
                    .map(pipeline => pipeline.stats)
                ]
              );

              const firstLetterUpperCase = s =>
                s && s.charAt && s.charAt(0).toUpperCase() + s.slice(1);

              const out = pipelineStats.map((s, i) => (
                <Tooltip key={i} placement="top" title={firstLetterUpperCase(s[0])}>
                  <Tag color={RECORD_STATUS[s[0]]}>{[s[1]]}</Tag>
                </Tooltip>
              ));

              return <span>{out}</span>;
            }}
          />
          <Column
            title="Action"
            dataIndex="action"
            key="action"
            render={(_, record) => {
              return (
                <Row type="flex" justify="start">
                  <Col span={4}>
                    <HEditor
                      jsonTemplate={JSON.stringify(
                        fixedDataSource.find(p => p.name === record.name),
                        null,
                        2
                      )}
                      styledButton={(onClick, isEditable = false) => (
                        <Badge dot={isEditable}>
                          <Button shape="circle" onClick={onClick}>
                            <Icon component={PlayIconSvg} />
                          </Button>
                        </Badge>
                      )}
                      title={'Execute Pipeline Editor'}
                      okText={'Execute'}
                      action={this.props.execStoredPipe}
                    />
                  </Col>
                  <Col span={4}>
                    <HEditor
                      jsonTemplate={JSON.stringify(
                        dataSource.find(p => p.name === record.name),
                        null,
                        2
                      )}
                      styledButton={(onClick, isEditable = false) => (
                        <Badge dot={isEditable}>
                          <Button shape="circle" icon="edit" onClick={onClick} />
                        </Badge>
                      )}
                      title={'Edit Pipeline Editor'}
                      okText={'Update'}
                      action={this.props.updateStoredPipeline}
                    />
                  </Col>
                  <Col span={4}>
                    <Button
                      type="danger"
                      shape="circle"
                      icon="delete"
                      onClick={() => deleteConfirmAction(this.props.deleteStoredPipeline, record)}
                    />
                  </Col>
                </Row>
              );
            }}
          />
        </Table>
        <Popover placement="topRight" title="Update algorithm" trigger="click">
          <HEditor
            jsonTemplate={JSON.stringify(template, null, 2)}
            styledButton={(onClick, isEditable = false) => <AddButton onVisible={onClick} />}
            title={'Add Pipeline Editor'}
            okText={'Store Pipeline'}
            hintText={
              <div>
                {' '}
                Hint: Type <strong>node</strong> for adding pipe-node.
              </div>
            }
            action={this.props.addPipe}
          />
        </Popover>
      </div>
    );
  }
}

StoredPipesTable.propTypes = {
  init: PropTypes.func.isRequired,
  dataSource: PropTypes.array.isRequired,
  dataStats: PropTypes.array.isRequired,
  execStoredPipe: PropTypes.func.isRequired,
  deleteStoredPipeline: PropTypes.func.isRequired,
  updateStoredPipeline: PropTypes.func.isRequired,
  cronStop: PropTypes.func.isRequired,
  cronStart: PropTypes.func.isRequired,
  addPipe: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  dataSource: state.storedPipeline.dataSource,
  dataStats: state.storedPipeline.dataStats
});

export default connect(
  mapStateToProps,
  {
    openModal,
    init,
    addPipe,
    execStoredPipe,
    deleteStoredPipeline,
    updateStoredPipeline,
    cronStop,
    cronStart
  }
)(StoredPipesTable);
