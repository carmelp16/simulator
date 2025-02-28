import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { getAlgorithmReadme } from 'actions/readme.action';

import Table from 'components/Table/Table.react';
import getAlgorithmColumns from 'components/Tables/Algorithms/getAlgorithmColumns.react';
import Card from 'components/common/Card.react';
import TabSwitcherMD from 'components/common/Tabs/TabSwitcherMD.react';
import { tableFilterSelector } from 'utils/tableSelector';
import { useAlgorithm } from 'hooks';
import { LEFT_SIDEBAR_NAMES } from 'const';

const dataSelector = tableFilterSelector(LEFT_SIDEBAR_NAMES.ALGORITHMS);

function AlgorithmsTable() {
  const dataSource = useSelector(dataSelector);
  const readmeDefault = useSelector(state => state.algorithmReadme);
  const dispatch = useDispatch();

  return (
    <Table
      rowKey={record => record.name}
      columns={getAlgorithmColumns({ ...useAlgorithm(), readmeDefault })}
      dataSource={dataSource}
      onExpand={(expanded, record) => {
        if (expanded) dispatch(getAlgorithmReadme(record.name));
      }}
      expandedRowRender={record => {
        return (
          <Card>
            <TabSwitcherMD
              jsonObject={record}
              readme={
                readmeDefault && readmeDefault[record.name] && readmeDefault[record.name].readme
              }
            />
          </Card>
        );
      }}
    />
  );
}

export default AlgorithmsTable;
